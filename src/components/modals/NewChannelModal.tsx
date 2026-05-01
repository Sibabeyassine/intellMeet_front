import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Hash, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { useChatStore } from "@/store/chat";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function NewChannelModal() {
  const { t } = useTranslation();
  const open = useUIStore(s => s.modal === "new-channel");
  const close = useUIStore(s => s.close);
  const create = useChatStore(s => s.createChannel);
  const setActive = useChatStore(s => s.setActive);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) { toast.error(t("modals.newChannel.errorRequired")); return; }
    setLoading(true);
    try {
      const ch = await create(name);
      setActive(ch.id);
      toast.success(t("chat.newChannelCreated", { name: ch.name }));
      close();
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Hash className="h-4 w-4" /> {t("modals.newChannel.title")}
          </DialogTitle>
          <DialogDescription>{t("modals.newChannel.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">{t("modals.newChannel.fieldName")}</Label>
            <Input id="name" name="name" placeholder={t("modals.newChannel.fieldNamePlaceholder")} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>{t("common.cancel")}</Button>
            <Button type="submit" variant="hero" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("modals.newChannel.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
