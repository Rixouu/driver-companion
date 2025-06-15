import { TranslationValue } from "../types";

export const ja: TranslationValue = {
    common: {
        status: {
            inProgress: "進行中",
            upcoming: "今後の予定",
            recent: "最近",
            active: "有効",
            inactive: "無効",
            completed: "完了",
            scheduled: "予定",
            type: "タイプ",
            pass: "合格",
            fail: "不合格",
            pending: "保留中",
        },
        loading: "読み込み中...",
        error: "エラー",
        success: "成功",
        cancel: "キャンセル",
        save: "保存",
        edit: "編集",
        delete: "削除",
        view: "表示",
        back: "戻る",
        next: "次へ",
        previous: "前へ",
        search: "検索",
        filter: "フィルター",
        all: "すべて",
        noResults: "結果が見つかりません",
        details: "詳細",
        actions: {
            default: "アクション",
            goHome: "ホームに戻る",
            tryAgain: "再試行",
            chat: "チャット"
        },
        actionsMenu: {
            default: "アクション",
            goHome: "ホームに戻る",
            tryAgain: "再試行",
            chat: "チャット"
        },
        booking: "予約",
        viewDetails: "詳細を表示",
        addNew: "新規追加",
        backTo: "に戻る",
        backToList: "リストに戻る",
        saving: "保存中...",
        update: "更新",
        create: "作成",
        created: "作成日時",
        deleting: "削除中...",
        creating: "作成中...",
        menu: "メニュー",
        login: "ログイン",
        logout: "ログアウト",
        darkMode: "ダークモード",
        total: "合計",
        type: "タイプ",
        saveChanges: "変更を保存",
        confirmDelete: "削除の確認",
        untitled: "無題",
        grid: "グリッド",
        list: "リスト",
        submitting: "送信中...",
        notAssigned: "未割り当て",
        noImage: "画像なし",
        minutes: "分",
        call: "電話",
        text: "テキスト",
        line: "LINE",
        exporting: "エクスポート中...",
        email: "メール",
        send: "メールを送信",
        sending: "送信中...",
        selected: "選択済み",
        current: "現在",
        updated: "更新日時",
        day: "日",
        week: "週",
        month: "月",
        today: "今日",
        unassign: "割り当て解除",
        assign: "割り当て",
        none: "なし",
        cannotBeUndone: "この操作は元に戻せません。",
        updateAndSend: "更新して送信",
        processing: "処理中...",
        copy: "コピー",
        activate: "有効化",
        deactivate: "無効化",
        dateFormat: {
            short: "YYYY/MM/DD",
            medium: "YYYY年M月D日",
            long: "YYYY年M月D日",
            monthYear: "YYYY年M月"
        },
        formHasErrors: "フォームにエラーがあります。送信する前に修正してください",
        exportPDF: "PDFをエクスポート",
        exportCSV: "CSVをエクスポート",
        notAvailable: "該当なし",
        notAvailableShort: "N/A",
        recentActivity: "最近のアクティビティ",
        date: "日付",
        cost: "費用",
        forms: {
            required: "必須"
        },
        notifications: {
            success: "成功",
            error: "エラー"
        },
        duplicate: "複製",
        time: "時間",
        showingResults: "{total}件中{start}〜{end}件の結果を表示中",
        nameEn: "名前（英語）",
        nameJa: "名前（日本語）",
        descriptionEn: "説明（英語）",
        descriptionJa: "説明（日本語）",
        order: "順序",
        add: "追加",
        clearFilters: "フィルターをクリア"
    },

    calendar: {
        weekdays: {
            mon: "月",
            tue: "火",
            wed: "水",
            thu: "木",
            fri: "金",
            sat: "土",
            sun: "日"
        },
        months: {
            january: "1月",
            february: "2月",
            march: "3月",
            april: "4月",
            may: "5月",
            june: "6月",
            july: "7月",
            august: "8月",
            september: "9月",
            october: "10月",
            november: "11月",
            december: "12月"
        }
    },
    auth: {
        logout: "ログアウト"
    },
    navigation: {
        dashboard: "ダッシュボード",
        vehicles: "車両",
        drivers: "ドライバー",
        bookings: "予約",
        quotations: "見積もり",
        pricing: "価格設定",
        dispatch: "配車",
        assignments: "割り当て",
        maintenance: "メンテナンス",
        inspections: "点検",
        reporting: "レポート",
        settings: "設定",
        fleet: "フリート",
        sales: "セールス",
        operations: "オペレーション",
        logout: "ログアウト"
    },
    drivers: {
        title: "ドライバー",
        description: "ドライバー情報を管理します",
        backToDriver: "ドライバーに戻る",
        search: "ドライバーを検索...",
        filters: {
            status: "ステータス",
            all: "すべてのドライバー",
            searchPlaceholder: "ドライバーを検索...",
            brand: "ステータスで絞り込み",
            model: "タイプで絞り込み",
            allBrands: "すべてのステータス",
            allModels: "すべてのタイプ",
            noResults: "結果が見つかりません",
            clearFilters: "フィルターをクリア"
        },
        actions: {
            addDriver: "ドライバーを追加",
            editDriver: "ドライバーを編集",
            updateDriver: "ドライバーを更新",
            viewDetails: "詳細を表示",
            deleteDriver: "ドライバーを削除",
            assignVehicle: "車両を割り当て",
            assignVehicleTo: "{name}に車両を割り当て",
            assignMultipleVehicles: "{count}台の車両を割り当て",
            unassignVehicle: "車両の割り当てを解除",
            unassignMultipleVehicles: "{count}台の車両の割り当てを解除",
            manageVehiclesFor: "{name}の車両を管理",
        },
        fields: {
            firstName: "名",
            lastName: "姓",
            email: "メールアドレス",
            phone: "電話番号",
            lineId: "LINE ID",
            licenseNumber: "免許証番号",
            licenseExpiry: "免許証の有効期限",
            expires: "有効期限",
            status: "ステータス",
            address: "住所",
            emergencyContact: "緊急連絡先",
            notes: "メモ",
            idLabel: "ID"
        },
        placeholders: {
            firstName: "名を入力",
            lastName: "姓を入力",
            email: "メールアドレスを入力",
            phone: "電話番号を入力",
            lineId: "LINE IDを入力",
            licenseNumber: "免許証番号を入力",
            licenseExpiry: "有効期限を選択",
            address: "住所を入力",
            emergencyContact: "緊急連絡先を入力",
            notes: "追加のメモを入力"
        },
        status: {
            title: "ステータス",
            active: "アクティブ",
            inactive: "非アクティブ",
            on_leave: "休暇中",
            training: "トレーニング中",
            available: "利用可能",
            unavailable: "利用不可",
            leave: "休暇中"
        },
        availability: {
            title: "ドライバーの空き状況",
            description: "このドライバーの空き時間を管理します。利用可能、休暇中、トレーニング中などを設定します。",
            setStatus: "ステータスを設定",
            statusLabel: "空き状況ステータス",
            selectStatus: "ステータスを選択",
            addAvailability: "空き時間を追加",
            editAvailability: "空き時間を編集",
            deleteAvailability: "空き時間を削除",
            calendarView: "カレンダービュー",
            listView: {
                title: "リストビュー",
                noRecords: "空き時間の記録が見つかりません。上のボタンをクリックして追加してください。",
                loading: "読み込み中...",
                addAvailability: "空き時間を追加",
                editAvailability: "空き時間を編集",
                deleteConfirmTitle: "よろしいですか？",
                deleteConfirmMessage: "この操作は元に戻せません。これにより、空き時間の記録が永久に削除されます。",
                deleteSuccess: "空き時間を削除しました",
                deleteSuccessMessage: "ドライバーの空き時間が正常に削除されました",
                deleteError: "ドライバーの空き時間の削除に失敗しました",
                loadError: "ドライバーの空き時間の読み込みに失敗しました",
                editDisabledTooltip: "予約の割り当ては編集できません",
                deleteDisabledTooltip: "予約の割り当ては削除できません"
            },
            loading: "読み込み中...",
            setAvailability: "空き状況を設定",
            setAvailabilityFor: "{date}の空き状況を設定",
            noAvailabilityRecords: "空き時間の記録がありません",
            availabilityRecords: "空き時間の記録",
            calendar: "空き状況カレンダー",
            dateRange: "期間",
            startDate: "開始日",
            endDate: "終了日",
            status: "ステータス",
            currentStatus: "現在のステータス",
            notes: "メモ",
            actions: "アクション",
            notesPlaceholder: "この空き時間に関するコメントを追加",
            statusActive: "アクティブ",
            statusInactive: "非アクティブ",
            statusMessage: "このドライバーは現在{status}で、{date}まで予約に割り当てられません。",
            availableMessage: "このドライバーは現在予約の割り当てが可能です。",
            upcomingSchedule: "今後のスケジュール",
            noUpcomingSchedule: "今後のスケジュールの変更はありません。",
            returnsFromLeave: "休暇から復帰",
            viewFullSchedule: "全スケジュールを表示",
            statuses: {
                available: "利用可能",
                unavailable: "利用不可",
                leave: "休暇中",
                training: "トレーニング中"
            },
            messages: {
                createSuccess: "空き時間が正常に作成されました",
                updateSuccess: "空き時間が正常に更新されました",
                deleteSuccess: "空き時間が正常に削除されました",
                createError: "空き時間の作成に失敗しました",
                updateError: "空き時間の更新に失敗しました",
                deleteError: "空き時間の削除に失敗しました"
            },
            returnMessage: "このドライバーは{date}に仕事に復帰します。",
            onBookingMessage: "このドライバーは現在{endTime}まで予約中です。"
        },
        vehicles: {
            title: "割り当てられた車両",
            description: "このドライバーに割り当てられた車両",
            noVehicles: "このドライバーに割り当てられた車両はありません"
        },
        upcomingBookings: {
            title: "今後の予約",
            description: "このドライバーの今後の予約",
            unassign: "割り当て解除",
            unassignSuccess: "予約の割り当てを解除しました",
            unassignSuccessDescription: "このドライバーから予約が削除されました。",
            unassignError: "予約の割り当て解除に失敗しました",
            empty: {
                title: "今後の予約はありません",
                description: "このドライバーには今後の予約がありません。"
            },
            booking: "予約 #{id}"
        },
        inspections: {
            empty: {
                title: "最近の点検はありません",
                description: "このドライバーは最近点検を行っていません。"
            }
        },
        currentStatus: {
            title: "現在のステータス"
        },
        keyInformation: {
            title: "基本情報"
        },
        tabs: {
            overview: "概要",
            availability: "空き状況",
            assignedVehicles: "割り当て車両",
            activityLog: "アクティビティログ"
        },
        recentActivity: {
            title: "最近のアクティビティ",
            description: "最新のアクティビティと割り当て"
        },
        activity: {
            empty: {
                title: "最近のアクティビティはありません",
                description: "このドライバーには表示する最近のアクティビティがありません。"
            }
        },
        bookingHistory: {
            title: "予約履歴",
            description: "このドライバーに割り当てられたすべての予約のリスト。",
            table: {
                dateTime: "日時",
                service: "サービス",
                customer: "顧客",
                status: "ステータス",
                actions: "アクション"
            },
            viewButton: "表示",
            empty: {
                title: "予約が見つかりません",
                description: "このドライバーには割り当てられた予約がありません。"
            }
        },
        pagination: {
            showing: "{total}件中{start}〜{end}件を表示中",
        },
        errors: {
            loadFailed: {
                title: "ドライバーを読み込めませんでした",
                description: "ドライバーID {driverId}の詳細を取得できませんでした。もう一度試すか、問題が解決しない場合はサポートにお問い合わせください。"
            },
            consoleDriverIdError: "サーバーコンポーネントでドライバーIDが欠落しているか無効です。",
            consoleLoadError: "サーバーコンポーネントでID {driverId}のドライバーデータの読み込み中にエラーが発生しました："
        },
        messages: {
            refreshError: "ドライバーデータの更新に失敗しました",
            consoleRefreshError: "ドライバーデータの更新中にエラーが発生しました",
            couldNotSaveViewPreference: "表示設定を保存できませんでした",
            loadError: "ドライバーデータの読み込みに失敗しました",
            loadErrorDescription: "ドライバー情報を取得できませんでした。もう一度お試しください。",
            noVehicleSelected: "車両が選択されていません",
            noVehicleSelectedDescription: "割り当てるには少なくとも1台の車両を選択してください。",
            noVehicleSelectedToUnassign: "割り当てを解除するには少なくとも1台の車両を選択してください。",
            assignSuccess: "車両が正常に割り当てられました",
            assignSuccessDescription: "このドライバーに車両が割り当てられました。",
            multipleAssignSuccessDescription: "{count}台の車両がこのドライバーに割り当てられました。",
            assignError: "車両の割り当てに失敗しました",
            assignErrorDescription: "ドライバーに車両を割り当てられませんでした。もう一度お試しください。",
            unassignSuccess: "車両の割り当てが正常に解除されました",
            unassignSuccessDescription: "このドライバーから車両の割り当てが解除されました。",
            multipleUnassignSuccessDescription: "{count}台の車両がこのドライバーから割り当て解除されました。",
            unassignError: "車両の割り当て解除に失敗しました",
            unassignErrorDescription: "ドライバーから車両の割り当てを解除できませんでした。もう一度お試しください。"
        }
    },
}

export default ja;