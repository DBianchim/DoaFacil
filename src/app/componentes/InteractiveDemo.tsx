"use client";

import { useState } from "react";
import { Button, Card, ConfirmDialog, Modal, useToast } from "@/components/ui";

export function InteractiveDemo() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <Card className="flex flex-wrap gap-3">
      <Button onClick={() => setModal(true)}>Abrir modal</Button>
      <Button variant="danger-soft" onClick={() => setConfirm(true)}>
        Remover (com confirmação)
      </Button>
      <Button variant="neutral" onClick={() => toast("Item marcado como reservado.")}>
        Toast de sucesso
      </Button>
      <Button variant="neutral" onClick={() => toast("Não foi possível salvar. Tente de novo.", "error")}>
        Toast de erro
      </Button>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Fale com Ricardo"
        description="Sobre: Mesa de Escritório em L · Bloco A"
        leading={
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-primary-mist text-3xl"
          >
            🗄️
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-caption font-semibold text-text-2">Ricardo prefere ser chamado por:</p>
          <Button variant="whatsapp" size="lg" fullWidth>
            Chamar no WhatsApp
          </Button>
          <Button variant="neutral" size="lg" fullWidth>
            Enviar e-mail
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          toast("Publicação removida.");
        }}
        title="Remover esta doação?"
        confirmLabel="Remover"
      >
        “Mesa de Escritório em L” sai do mural e seus contatos deste anúncio são apagados. Isso não pode ser desfeito.
      </ConfirmDialog>
    </Card>
  );
}
