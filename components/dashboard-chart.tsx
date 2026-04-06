"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

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
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

export function DashboardChart({ 
  data, 
  growth = 0 
}: { 
  data: any[],
  growth?: number
}) {
  // If no data is provided from DB, use realistic mock data
  const chartData = data?.length ? data : [
    { dia: "Seg", mensagens: 0 },
    { dia: "Ter", mensagens: 0 },
    { dia: "Qua", mensagens: 0 },
    { dia: "Qui", mensagens: 0 },
    { dia: "Sex", mensagens: 0 },
    { dia: "Sáb", mensagens: 0 },
    { dia: "Dom", mensagens: 0 },
  ]

  const totalMensagens = chartData.reduce((acc, curr) => acc + curr.mensagens, 0)
  const isPositive = growth > 0;
  const isNegative = growth < 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Volume de Interações</CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="dia"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              fontSize={12}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `${value}`}
              fontSize={12}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
              content={<ChartTooltipContent hideLabel className="bg-background border-border shadow-sm" />}
            />
            <Bar 
              dataKey="mensagens" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={50}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.mensagens === 0 ? "var(--color-muted)" : "var(--color-primary)"} 
                  fillOpacity={0.8}
                  className="hover:fill-opacity-100 transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-4">
        <div className="flex gap-2 font-medium leading-none items-center">
          {isPositive ? (
            <>Crescimento de {growth.toFixed(1)}% esta semana <TrendingUp className="h-4 w-4 text-emerald-500" /></>
          ) : isNegative ? (
            <>Queda de {Math.abs(growth).toFixed(1)}% esta semana <TrendingDown className="h-4 w-4 text-red-500" /></>
          ) : (
            <>Sem variação esta semana <Minus className="h-4 w-4 text-muted-foreground" /></>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando total de {totalMensagens} interações nos últimos 7 dias.
        </div>
      </CardFooter>
    </Card>
  )
}