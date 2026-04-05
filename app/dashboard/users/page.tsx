import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServiceSupabase } from "@/lib/supabase";

export const revalidate = 0;

export default async function UsersPage() {
  const supabase = getServiceSupabase();
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
        <Button>Adicionar Usuário</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Telefone</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{user.name || 'Sem nome'}</td>
                      <td className="p-4 align-middle">{user.phone}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${user.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                          {user.status === 'active' ? 'Ativo' : user.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">Editar</Button>
                      </td>
                    </tr>
                  ))}
                  {!users?.length && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
