-- Create optimized RPC function for fetching inspections with all related data
-- This eliminates the N+1 query problem by fetching everything in one database call

CREATE OR REPLACE FUNCTION get_inspections_with_details(
    page_num INT,
    page_size INT,
    status_filter TEXT DEFAULT 'all',
    search_query TEXT DEFAULT '',
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    date TIMESTAMPTZ,
    status TEXT,
    type TEXT,
    vehicle_id UUID,
    inspector_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    notes TEXT,
    -- Vehicle fields
    vehicle_name TEXT,
    vehicle_plate_number TEXT,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_year TEXT,
    -- Inspector fields
    inspector_name TEXT,
    inspector_email TEXT,
    -- Template Display Name
    template_display_name TEXT,
    -- Total Count for pagination
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH inspections_paged AS (
        SELECT
            i.*,
            -- Get template name from assignments with fallback logic
            COALESCE(
                -- First try: direct vehicle assignment
                (SELECT a.template_type 
                 FROM inspection_template_assignments a 
                 WHERE a.vehicle_id = i.vehicle_id AND a.is_active = TRUE 
                 LIMIT 1),
                -- Second try: vehicle group assignment
                (SELECT a.template_type 
                 FROM inspection_template_assignments a 
                 JOIN vehicles v_group ON a.vehicle_group_id = v_group.vehicle_group_id 
                 WHERE v_group.id = i.vehicle_id AND a.is_active = TRUE 
                 LIMIT 1),
                -- Fallback: use inspection type
                i.type
            ) AS final_template_name
        FROM
            inspections i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        WHERE
            (status_filter = 'all' OR i.status = status_filter)
            AND (
                search_query = ''
                OR v.name ILIKE '%' || search_query || '%'
                OR v.plate_number ILIKE '%' || search_query || '%'
                OR v.brand ILIKE '%' || search_query || '%'
                OR v.model ILIKE '%' || search_query || '%'
            )
            AND (
                date_from IS NULL OR i.date >= date_from
            )
            AND (
                date_to IS NULL OR i.date <= date_to
            )
        ORDER BY
            i.date DESC, i.created_at DESC
        LIMIT page_size
        OFFSET (page_num - 1) * page_size
    ),
    total_count_cte AS (
        SELECT COUNT(*) as total
        FROM inspections i
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        WHERE
            (status_filter = 'all' OR i.status = status_filter)
            AND (
                search_query = ''
                OR v.name ILIKE '%' || search_query || '%'
                OR v.plate_number ILIKE '%' || search_query || '%'
                OR v.brand ILIKE '%' || search_query || '%'
                OR v.model ILIKE '%' || search_query || '%'
            )
            AND (
                date_from IS NULL OR i.date >= date_from
            )
            AND (
                date_to IS NULL OR i.date <= date_to
            )
    )
    SELECT
        ip.id,
        ip.date,
        ip.status,
        ip.type,
        ip.vehicle_id,
        ip.inspector_id,
        ip.created_at,
        ip.updated_at,
        ip.notes,
        v.name AS vehicle_name,
        v.plate_number AS vehicle_plate_number,
        v.brand AS vehicle_brand,
        v.model AS vehicle_model,
        v.year AS vehicle_year,
        p.full_name AS inspector_name,
        p.email AS inspector_email,
        ip.final_template_name AS template_display_name,
        tc.total AS total_count
    FROM
        inspections_paged ip
    LEFT JOIN vehicles v ON ip.vehicle_id = v.id
    LEFT JOIN profiles p ON ip.inspector_id = p.id
    CROSS JOIN total_count_cte tc;
END;
$$ LANGUAGE plpgsql;

-- Create index to optimize the query performance
CREATE INDEX IF NOT EXISTS idx_inspections_status_date_vehicle 
ON inspections(status, date DESC, vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_search 
ON vehicles(name, plate_number, brand, model);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_inspections_with_details TO authenticated;
