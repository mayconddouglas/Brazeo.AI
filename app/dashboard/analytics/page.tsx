import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Uso por Intenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium">criar_lembrete</div>
                <div className="flex-1 ml-4">
                  <div className="h-2 w-[75%] rounded-full bg-primary"></div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">45%</div>
              </div>
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium">resposta_livre</div>
                <div className="flex-1 ml-4">
                  <div className="h-2 w-[45%] rounded-full bg-primary/80"></div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">25%</div>
              </div>
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium">resumir_texto</div>
                <div className="flex-1 ml-4">
                  <div className="h-2 w-[30%] rounded-full bg-primary/60"></div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">15%</div>
              </div>
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium">consultor_rapido</div>
                <div className="flex-1 ml-4">
                  <div className="h-2 w-[20%] rounded-full bg-primary/40"></div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">10%</div>
              </div>
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium">planejar_semana</div>
                <div className="flex-1 ml-4">
                  <div className="h-2 w-[10%] rounded-full bg-primary/20"></div>
                </div>
                <div className="ml-4 text-sm text-muted-foreground">5%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-5xl font-bold text-green-500">94%</div>
            <p className="mt-2 text-sm text-muted-foreground">das intenções compreendidas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
