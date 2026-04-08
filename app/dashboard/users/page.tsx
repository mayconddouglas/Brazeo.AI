import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceSupabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { AddUserButton } from "./add-user-button";
import { UserActions } from "./user-actions";
import { SearchInput } from "./search-input";

export const revalidate = 0;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.query || "";
  const page = Number(resolvedParams?.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  const supabase = getServiceSupabase();
  
  let supabaseQuery = supabase.from('users').select('*', { count: 'exact' });
  
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
  }
  
  const { data: users, count } = await supabaseQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
        <AddUserButton />
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Lista de Usuários</CardTitle>
          <SearchInput />
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
                        {user.status === 'active' && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-transparent">
                            Ativo
                          </Badge>
                        )}
                        {user.status === 'waitlist' && (
                          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent">
                            Lista de Espera
                          </Badge>
                        )}
                        {user.status === 'blocked' && (
                          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white border-transparent">
                            Bloqueado
                          </Badge>
                        )}
                        {!['active', 'waitlist', 'blocked'].includes(user.status) && (
                          <Badge variant="outline">
                            {user.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <UserActions user={user} />
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
          
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
