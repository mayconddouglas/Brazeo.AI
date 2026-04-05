import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConversationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Conversas</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 h-[600px] overflow-hidden flex flex-col">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-base">Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="flex flex-col">
              <button className="flex flex-col items-start gap-2 border-b p-4 text-left text-sm transition-all hover:bg-accent bg-accent">
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">João Silva</div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      Há 2 min
                    </div>
                  </div>
                  <div className="text-xs font-medium">criar_lembrete</div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  Me lembra de comprar pão amanhã às 8h
                </div>
              </button>
              <button className="flex flex-col items-start gap-2 border-b p-4 text-left text-sm transition-all hover:bg-accent">
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">Maria Souza</div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      Há 1 hora
                    </div>
                  </div>
                  <div className="text-xs font-medium">resumir_texto</div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  Pode resumir esse artigo pra mim?
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 h-[600px] flex flex-col">
          <CardHeader className="border-b px-4 py-3 flex flex-row items-center">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">João Silva</CardTitle>
              <span className="text-xs text-muted-foreground">+55 11 99999-9999</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-auto flex flex-col gap-4">
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">
              Me lembra de comprar pão amanhã às 8h
            </div>
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground">
              Anotado! Vou te lembrar de comprar pão amanhã às 08:00 ⏰
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
