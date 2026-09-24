import "server-only";

/**
 * Variáveis de ambiente do servidor. Nenhuma delas tem prefixo NEXT_PUBLIC_,
 * então o Next nunca as inclui no JavaScript enviado ao navegador.
 * São lidas sob demanda para o build não quebrar quando faltarem.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida. Veja .env.example.`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get condoCode() {
    return required("CONDO_CODE").toUpperCase();
  },
  get condoCodeVersion() {
    return required("CONDO_CODE_VERSION");
  },
  get condoName() {
    return process.env.CONDO_NAME || "Condomínio";
  },
  get adminPassword() {
    return required("ADMIN_PASSWORD");
  },
};
