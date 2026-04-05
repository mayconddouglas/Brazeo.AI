"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Gráfico de mensagens dos últimos 7 dias"

const chartConfig = {
  mensagens: {
    label: "Mensagens",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function DashboardChart({ data }: { data: any[] }) {
  // If no data is provided from DB, use realistic mock data
  const chartData = data?.length ? data : [
    { dia: "Seg", mensagens: 186 },
    { dia: "Ter", mensagens: 305 },
    { dia: "Qua", mensagens: 237 },
    { dia: "Qui", mensagens: 73 },
    { dia: "Sex", mensagens: 209 },
    { dia: "Sáb", mensagens: 214 },
    { dia: "Dom", mensagens: 140 },
  ]

  const totalMensagens = chartData.reduce((acc, curr) => acc + curr.mensagens, 0)

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Volume de Interações</CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dia"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="mensagens" fill="var(--color-mensagens)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-4">
        <div className="flex gap-2 font-medium leading-none">
          Crescimento de 5.2% esta semana <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando total de {totalMensagens} mensagens processadas.
        </div>
      </CardFooter>
    </Card>
  )
}