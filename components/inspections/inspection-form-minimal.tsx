"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InspectionTypeSelector } from "./inspection-type-selector"
import { useI18n } from "@/lib/i18n/context"
import { InspectionType } from "@/lib/types/inspections"

const schema = z.object({
  type: z.enum(["routine", "safety", "maintenance"]).default("routine"),
})

type FormData = z.infer<typeof schema>

export function InspectionFormMinimal() {
  const { t } = useI18n()
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'routine',
    },
  })

  const onSubmit = methods.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('inspections.type.select')}</CardTitle>
          </CardHeader>
          <CardContent>
            <InspectionTypeSelector
              control={methods.control}
              onTypeChange={(type) => console.log(type)}
              defaultValue="routine"
            />
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
} 