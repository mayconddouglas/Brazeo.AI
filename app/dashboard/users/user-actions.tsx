"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { updateUser, deleteUser, approveUserAction } from "./actions";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { UserProfileSheet } from "./user-profile-sheet";

export function UserActions({ user }: { user: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    formData.append("id", user.id);
    const res = await updateUser(formData);
    if (res.error) {
      setError(res.error);
    } else {
      setIsEditOpen(false);
    }
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.error) {
        setError(res.error);
      } else {
        setIsDeleteOpen(false);
      }
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveUserAction(user.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Usuário aprovado e notificado!");
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      {user.status === 'waitlist' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleApprove} 
          disabled={isPending}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          {isPending ? "Aprovando..." : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
            </>
          )}
        </Button>
      )}

      <UserProfileSheet user={user} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger render={<Button variant="ghost" size="sm">Editar</Button>} />
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Faça alterações no perfil de {user.name || 'usuário'} aqui.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user.name || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={user.phone}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <select 
                  id="status" 
                  name="status"
                  defaultValue={user.status}
                  className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="waitlist">Lista de Espera</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger render={<Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Excluir</Button>} />
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário {user.name || user.phone}? Esta ação não pode ser desfeita. Todo o histórico de mensagens e tarefas dele será apagado.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir Definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}