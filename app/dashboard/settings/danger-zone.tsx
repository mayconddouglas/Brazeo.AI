"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { resetSettingsAction } from "./actions";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DangerZone() {
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    startTransition(async () => {
      const res = await resetSettingsAction();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Configurações resetadas com sucesso.");
      }
    });
  };

  return (
    <Card className="border-red-200 dark:border-red-900 mt-8">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="size-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações destrutivas e irreversíveis que afetam o comportamento global do agente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
          <div className="space-y-1">
            <h4 className="font-medium text-red-900 dark:text-red-200">Resetar todas as configurações</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              Isso apagará o nome, as chaves de API e restaurará as instruções originais do assistente.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border h-10 px-4 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300">
              Resetar Configurações
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso removerá todas as chaves de integração, o nome personalizado e as instruções do seu agente, retornando ao estado padrão de fábrica.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleReset}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? "Resetando..." : "Sim, resetar tudo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}