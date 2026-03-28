drop extension if exists "pg_net";


  create table "public"."agentes_ia" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "equipe_id" uuid,
    "nome" text not null,
    "tipo" text not null,
    "provider" text not null default 'openai'::text,
    "graph_id" text,
    "versao_prompt" text default 'v1'::text,
    "prompt_sistema" text,
    "configuracao" jsonb not null default '{}'::jsonb,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."alembic_version" (
    "version_num" character varying(32) not null
      );



  create table "public"."cadence_execucoes" (
    "id" uuid not null default gen_random_uuid(),
    "fluxo_id" uuid not null,
    "empresa_id" uuid not null,
    "contato_id" uuid not null,
    "conexao_id" uuid not null,
    "oportunidade_id" uuid,
    "step_atual" integer not null default '-1'::integer,
    "status" character varying(20) not null default 'ativa'::character varying,
    "proximo_celery_task_id" character varying(255),
    "iniciada_em" timestamp with time zone not null default now(),
    "encerrada_em" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "proximo_step_em" timestamp with time zone
      );



  create table "public"."cadence_fluxos" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "nome" character varying(255) not null,
    "descricao" text,
    "mensagem_inicial" text not null,
    "steps" jsonb not null default '[]'::jsonb,
    "acao_resposta" character varying(50) not null default 'continuar_ia'::character varying,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."chats" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "contato_id" uuid not null,
    "conexao_id" uuid not null,
    "filial_id" uuid,
    "equipe_id" uuid,
    "agente_ia_id" uuid,
    "usuario_responsavel_id" uuid,
    "oportunidade_id" uuid,
    "status" text not null,
    "origem_abertura" text,
    "motivo_encerramento" text,
    "graph_thread_id" text,
    "contexto_resumido" jsonb not null default '{}'::jsonb,
    "iniciado_em" timestamp with time zone not null default now(),
    "ultima_mensagem_em" timestamp with time zone,
    "encerrado_em" timestamp with time zone
      );



  create table "public"."conexoes" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "filial_id" uuid,
    "equipe_padrao_id" uuid,
    "nome" text not null,
    "canal" text not null default 'whatsapp'::text,
    "provedor" text not null default 'uazapi'::text,
    "telefone_e164" text not null,
    "identificador_externo" text,
    "token_ref" text,
    "webhook_secret_ref" text,
    "configuracao" jsonb not null default '{}'::jsonb,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."contatos" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "nome" text,
    "telefone_e164" text not null,
    "whatsapp_id" text,
    "email" text,
    "cidade_interesse" text,
    "origem_inicial" text,
    "origem_atual" text,
    "observacoes" text,
    "opt_out" boolean not null default false,
    "ultimo_contato_em" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."empresas" (
    "id" uuid not null default gen_random_uuid(),
    "nome" text not null,
    "slug" text not null,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."equipes" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "filial_id" uuid not null,
    "nome" text not null,
    "linha_negocio" text not null,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."eventos_webhook" (
    "id" uuid not null default gen_random_uuid(),
    "conexao_id" uuid,
    "provedor" text not null default 'uazapi'::text,
    "evento_externo_id" text,
    "tipo_evento" text,
    "payload" jsonb not null,
    "recebido_em" timestamp with time zone not null default now(),
    "processado_em" timestamp with time zone,
    "status" text not null default 'recebido'::text,
    "payload_hash" character varying(64)
      );



  create table "public"."filiais" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "nome" text not null,
    "cidade" text not null,
    "estado" character(2) not null,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."imoveis" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "filial_id" uuid,
    "codigo_externo" text,
    "titulo" text not null,
    "linha_negocio" text not null,
    "cidade" text not null,
    "bairro" text,
    "preco_venda" numeric(14,2),
    "preco_aluguel" numeric(14,2),
    "quartos" integer,
    "banheiros" integer,
    "vagas" integer,
    "area_m2" numeric(10,2),
    "ativo" boolean not null default true,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."interesses_imovel" (
    "id" uuid not null default gen_random_uuid(),
    "oportunidade_id" uuid not null,
    "imovel_id" uuid not null,
    "grau_interesse" text not null default 'medio'::text,
    "observacoes" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."mensagens" (
    "id" uuid not null default gen_random_uuid(),
    "chat_id" uuid not null,
    "direcao" text not null,
    "autor_tipo" text not null,
    "autor_id" uuid,
    "provedor" text default 'uazapi'::text,
    "mensagem_externa_id" text,
    "mensagem_pai_externa_id" text,
    "tipo" text not null,
    "texto" text,
    "midia_url" text,
    "payload" jsonb not null default '{}'::jsonb,
    "status_envio" text default 'pendente'::text,
    "criada_em" timestamp with time zone not null default now()
      );



  create table "public"."oportunidades" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "contato_id" uuid not null,
    "filial_id" uuid,
    "equipe_id" uuid,
    "usuario_responsavel_id" uuid,
    "conexao_origem_id" uuid,
    "linha_negocio" text not null,
    "status" text not null,
    "origem" text,
    "interesse_cidade" text,
    "interesse_bairro" text,
    "orcamento_min" numeric(14,2),
    "orcamento_max" numeric(14,2),
    "quartos_min" integer,
    "observacoes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."regras_roteamento" (
    "id" uuid not null default gen_random_uuid(),
    "conexao_id" uuid not null,
    "nome" text not null,
    "prioridade" integer not null,
    "ativa" boolean not null default true,
    "acao" text not null,
    "iniciar_chat" boolean not null default true,
    "equipe_destino_id" uuid,
    "agente_ia_destino_id" uuid,
    "condicoes" jsonb not null default '{}'::jsonb,
    "stop_on_match" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."usuarios" (
    "id" uuid not null default gen_random_uuid(),
    "empresa_id" uuid not null,
    "equipe_id" uuid,
    "nome" text not null,
    "email" text,
    "telefone_e164" text,
    "papel" text not null,
    "ativo" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "senha_hash" text,
    "login" character varying(100) not null
      );


CREATE UNIQUE INDEX agentes_ia_pkey ON public.agentes_ia USING btree (id);

CREATE UNIQUE INDEX alembic_version_pkc ON public.alembic_version USING btree (version_num);

CREATE UNIQUE INDEX cadence_execucoes_pkey ON public.cadence_execucoes USING btree (id);

CREATE UNIQUE INDEX cadence_fluxos_pkey ON public.cadence_fluxos USING btree (id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE UNIQUE INDEX conexoes_empresa_id_telefone_e164_key ON public.conexoes USING btree (empresa_id, telefone_e164);

CREATE UNIQUE INDEX conexoes_pkey ON public.conexoes USING btree (id);

CREATE UNIQUE INDEX contatos_empresa_id_telefone_e164_key ON public.contatos USING btree (empresa_id, telefone_e164);

CREATE UNIQUE INDEX contatos_pkey ON public.contatos USING btree (id);

CREATE UNIQUE INDEX empresas_pkey ON public.empresas USING btree (id);

CREATE UNIQUE INDEX empresas_slug_key ON public.empresas USING btree (slug);

CREATE UNIQUE INDEX equipes_filial_id_nome_key ON public.equipes USING btree (filial_id, nome);

CREATE UNIQUE INDEX equipes_pkey ON public.equipes USING btree (id);

CREATE UNIQUE INDEX eventos_webhook_pkey ON public.eventos_webhook USING btree (id);

CREATE UNIQUE INDEX filiais_empresa_id_nome_key ON public.filiais USING btree (empresa_id, nome);

CREATE UNIQUE INDEX filiais_pkey ON public.filiais USING btree (id);

CREATE INDEX idx_chats_status_ultima_msg ON public.chats USING btree (status, ultima_mensagem_em DESC);

CREATE INDEX idx_contatos_empresa_telefone ON public.contatos USING btree (empresa_id, telefone_e164);

CREATE INDEX idx_eventos_webhook_payload_hash ON public.eventos_webhook USING btree (payload_hash) WHERE (payload_hash IS NOT NULL);

CREATE INDEX idx_mensagens_chat_criada_em ON public.mensagens USING btree (chat_id, criada_em);

CREATE INDEX idx_oportunidades_contato_status ON public.oportunidades USING btree (contato_id, status);

CREATE UNIQUE INDEX imoveis_empresa_id_codigo_externo_key ON public.imoveis USING btree (empresa_id, codigo_externo);

CREATE UNIQUE INDEX imoveis_pkey ON public.imoveis USING btree (id);

CREATE UNIQUE INDEX interesses_imovel_oportunidade_id_imovel_id_key ON public.interesses_imovel USING btree (oportunidade_id, imovel_id);

CREATE UNIQUE INDEX interesses_imovel_pkey ON public.interesses_imovel USING btree (id);

CREATE INDEX ix_cadence_exec_contato_ativa ON public.cadence_execucoes USING btree (empresa_id, contato_id, status);

CREATE INDEX ix_cadence_fluxos_empresa_id ON public.cadence_fluxos USING btree (empresa_id);

CREATE UNIQUE INDEX mensagens_pkey ON public.mensagens USING btree (id);

CREATE UNIQUE INDEX oportunidades_pkey ON public.oportunidades USING btree (id);

CREATE UNIQUE INDEX regras_roteamento_conexao_id_prioridade_key ON public.regras_roteamento USING btree (conexao_id, prioridade);

CREATE UNIQUE INDEX regras_roteamento_pkey ON public.regras_roteamento USING btree (id);

CREATE UNIQUE INDEX uq_chat_aberto_por_contato_conexao ON public.chats USING btree (empresa_id, contato_id, conexao_id) WHERE (status = ANY (ARRAY['aberto'::text, 'aguardando_lead'::text, 'aguardando_humano'::text]));

CREATE UNIQUE INDEX uq_evento_webhook_externo ON public.eventos_webhook USING btree (provedor, evento_externo_id) WHERE (evento_externo_id IS NOT NULL);

CREATE UNIQUE INDEX uq_mensagem_externa ON public.mensagens USING btree (provedor, mensagem_externa_id) WHERE (mensagem_externa_id IS NOT NULL);

CREATE UNIQUE INDEX uq_usuarios_login ON public.usuarios USING btree (login);

CREATE UNIQUE INDEX usuarios_empresa_id_email_key ON public.usuarios USING btree (empresa_id, email);

CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id);

alter table "public"."agentes_ia" add constraint "agentes_ia_pkey" PRIMARY KEY using index "agentes_ia_pkey";

alter table "public"."alembic_version" add constraint "alembic_version_pkc" PRIMARY KEY using index "alembic_version_pkc";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_pkey" PRIMARY KEY using index "cadence_execucoes_pkey";

alter table "public"."cadence_fluxos" add constraint "cadence_fluxos_pkey" PRIMARY KEY using index "cadence_fluxos_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."conexoes" add constraint "conexoes_pkey" PRIMARY KEY using index "conexoes_pkey";

alter table "public"."contatos" add constraint "contatos_pkey" PRIMARY KEY using index "contatos_pkey";

alter table "public"."empresas" add constraint "empresas_pkey" PRIMARY KEY using index "empresas_pkey";

alter table "public"."equipes" add constraint "equipes_pkey" PRIMARY KEY using index "equipes_pkey";

alter table "public"."eventos_webhook" add constraint "eventos_webhook_pkey" PRIMARY KEY using index "eventos_webhook_pkey";

alter table "public"."filiais" add constraint "filiais_pkey" PRIMARY KEY using index "filiais_pkey";

alter table "public"."imoveis" add constraint "imoveis_pkey" PRIMARY KEY using index "imoveis_pkey";

alter table "public"."interesses_imovel" add constraint "interesses_imovel_pkey" PRIMARY KEY using index "interesses_imovel_pkey";

alter table "public"."mensagens" add constraint "mensagens_pkey" PRIMARY KEY using index "mensagens_pkey";

alter table "public"."oportunidades" add constraint "oportunidades_pkey" PRIMARY KEY using index "oportunidades_pkey";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_pkey" PRIMARY KEY using index "regras_roteamento_pkey";

alter table "public"."usuarios" add constraint "usuarios_pkey" PRIMARY KEY using index "usuarios_pkey";

alter table "public"."agentes_ia" add constraint "agentes_ia_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."agentes_ia" validate constraint "agentes_ia_empresa_id_fkey";

alter table "public"."agentes_ia" add constraint "agentes_ia_equipe_id_fkey" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."agentes_ia" validate constraint "agentes_ia_equipe_id_fkey";

alter table "public"."agentes_ia" add constraint "agentes_ia_tipo_check" CHECK ((tipo = ANY (ARRAY['triagem'::text, 'vendas'::text, 'aluguel'::text, 'pos_atendimento'::text]))) not valid;

alter table "public"."agentes_ia" validate constraint "agentes_ia_tipo_check";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_conexao_id_fkey" FOREIGN KEY (conexao_id) REFERENCES public.conexoes(id) not valid;

alter table "public"."cadence_execucoes" validate constraint "cadence_execucoes_conexao_id_fkey";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_contato_id_fkey" FOREIGN KEY (contato_id) REFERENCES public.contatos(id) not valid;

alter table "public"."cadence_execucoes" validate constraint "cadence_execucoes_contato_id_fkey";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) not valid;

alter table "public"."cadence_execucoes" validate constraint "cadence_execucoes_empresa_id_fkey";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_fluxo_id_fkey" FOREIGN KEY (fluxo_id) REFERENCES public.cadence_fluxos(id) not valid;

alter table "public"."cadence_execucoes" validate constraint "cadence_execucoes_fluxo_id_fkey";

alter table "public"."cadence_execucoes" add constraint "cadence_execucoes_oportunidade_id_fkey" FOREIGN KEY (oportunidade_id) REFERENCES public.oportunidades(id) not valid;

alter table "public"."cadence_execucoes" validate constraint "cadence_execucoes_oportunidade_id_fkey";

alter table "public"."cadence_fluxos" add constraint "cadence_fluxos_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) not valid;

alter table "public"."cadence_fluxos" validate constraint "cadence_fluxos_empresa_id_fkey";

alter table "public"."chats" add constraint "chats_agente_ia_id_fkey" FOREIGN KEY (agente_ia_id) REFERENCES public.agentes_ia(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_agente_ia_id_fkey";

alter table "public"."chats" add constraint "chats_conexao_id_fkey" FOREIGN KEY (conexao_id) REFERENCES public.conexoes(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_conexao_id_fkey";

alter table "public"."chats" add constraint "chats_contato_id_fkey" FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_contato_id_fkey";

alter table "public"."chats" add constraint "chats_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "chats_empresa_id_fkey";

alter table "public"."chats" add constraint "chats_equipe_id_fkey" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_equipe_id_fkey";

alter table "public"."chats" add constraint "chats_filial_id_fkey" FOREIGN KEY (filial_id) REFERENCES public.filiais(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_filial_id_fkey";

alter table "public"."chats" add constraint "chats_oportunidade_id_fkey" FOREIGN KEY (oportunidade_id) REFERENCES public.oportunidades(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_oportunidade_id_fkey";

alter table "public"."chats" add constraint "chats_status_check" CHECK ((status = ANY (ARRAY['aberto'::text, 'aguardando_lead'::text, 'aguardando_humano'::text, 'encerrado'::text, 'ignorado'::text]))) not valid;

alter table "public"."chats" validate constraint "chats_status_check";

alter table "public"."chats" add constraint "chats_usuario_responsavel_id_fkey" FOREIGN KEY (usuario_responsavel_id) REFERENCES public.usuarios(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_usuario_responsavel_id_fkey";

alter table "public"."conexoes" add constraint "conexoes_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."conexoes" validate constraint "conexoes_empresa_id_fkey";

alter table "public"."conexoes" add constraint "conexoes_empresa_id_telefone_e164_key" UNIQUE using index "conexoes_empresa_id_telefone_e164_key";

alter table "public"."conexoes" add constraint "conexoes_equipe_padrao_id_fkey" FOREIGN KEY (equipe_padrao_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."conexoes" validate constraint "conexoes_equipe_padrao_id_fkey";

alter table "public"."conexoes" add constraint "conexoes_filial_id_fkey" FOREIGN KEY (filial_id) REFERENCES public.filiais(id) ON DELETE CASCADE not valid;

alter table "public"."conexoes" validate constraint "conexoes_filial_id_fkey";

alter table "public"."contatos" add constraint "contatos_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."contatos" validate constraint "contatos_empresa_id_fkey";

alter table "public"."contatos" add constraint "contatos_empresa_id_telefone_e164_key" UNIQUE using index "contatos_empresa_id_telefone_e164_key";

alter table "public"."empresas" add constraint "empresas_slug_key" UNIQUE using index "empresas_slug_key";

alter table "public"."equipes" add constraint "equipes_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."equipes" validate constraint "equipes_empresa_id_fkey";

alter table "public"."equipes" add constraint "equipes_filial_id_fkey" FOREIGN KEY (filial_id) REFERENCES public.filiais(id) ON DELETE CASCADE not valid;

alter table "public"."equipes" validate constraint "equipes_filial_id_fkey";

alter table "public"."equipes" add constraint "equipes_filial_id_nome_key" UNIQUE using index "equipes_filial_id_nome_key";

alter table "public"."equipes" add constraint "equipes_linha_negocio_check" CHECK ((linha_negocio = ANY (ARRAY['venda'::text, 'aluguel'::text, 'triagem'::text]))) not valid;

alter table "public"."equipes" validate constraint "equipes_linha_negocio_check";

alter table "public"."eventos_webhook" add constraint "eventos_webhook_conexao_id_fkey" FOREIGN KEY (conexao_id) REFERENCES public.conexoes(id) ON DELETE SET NULL not valid;

alter table "public"."eventos_webhook" validate constraint "eventos_webhook_conexao_id_fkey";

alter table "public"."eventos_webhook" add constraint "eventos_webhook_status_check" CHECK ((status = ANY (ARRAY['recebido'::text, 'processado'::text, 'erro'::text, 'ignorado'::text]))) not valid;

alter table "public"."eventos_webhook" validate constraint "eventos_webhook_status_check";

alter table "public"."filiais" add constraint "filiais_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."filiais" validate constraint "filiais_empresa_id_fkey";

alter table "public"."filiais" add constraint "filiais_empresa_id_nome_key" UNIQUE using index "filiais_empresa_id_nome_key";

alter table "public"."imoveis" add constraint "imoveis_empresa_id_codigo_externo_key" UNIQUE using index "imoveis_empresa_id_codigo_externo_key";

alter table "public"."imoveis" add constraint "imoveis_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."imoveis" validate constraint "imoveis_empresa_id_fkey";

alter table "public"."imoveis" add constraint "imoveis_filial_id_fkey" FOREIGN KEY (filial_id) REFERENCES public.filiais(id) ON DELETE CASCADE not valid;

alter table "public"."imoveis" validate constraint "imoveis_filial_id_fkey";

alter table "public"."imoveis" add constraint "imoveis_linha_negocio_check" CHECK ((linha_negocio = ANY (ARRAY['venda'::text, 'aluguel'::text]))) not valid;

alter table "public"."imoveis" validate constraint "imoveis_linha_negocio_check";

alter table "public"."interesses_imovel" add constraint "interesses_imovel_grau_interesse_check" CHECK ((grau_interesse = ANY (ARRAY['baixo'::text, 'medio'::text, 'alto'::text]))) not valid;

alter table "public"."interesses_imovel" validate constraint "interesses_imovel_grau_interesse_check";

alter table "public"."interesses_imovel" add constraint "interesses_imovel_imovel_id_fkey" FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE not valid;

alter table "public"."interesses_imovel" validate constraint "interesses_imovel_imovel_id_fkey";

alter table "public"."interesses_imovel" add constraint "interesses_imovel_oportunidade_id_fkey" FOREIGN KEY (oportunidade_id) REFERENCES public.oportunidades(id) ON DELETE CASCADE not valid;

alter table "public"."interesses_imovel" validate constraint "interesses_imovel_oportunidade_id_fkey";

alter table "public"."interesses_imovel" add constraint "interesses_imovel_oportunidade_id_imovel_id_key" UNIQUE using index "interesses_imovel_oportunidade_id_imovel_id_key";

alter table "public"."mensagens" add constraint "mensagens_autor_tipo_check" CHECK ((autor_tipo = ANY (ARRAY['contato'::text, 'ia'::text, 'usuario'::text, 'sistema'::text]))) not valid;

alter table "public"."mensagens" validate constraint "mensagens_autor_tipo_check";

alter table "public"."mensagens" add constraint "mensagens_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."mensagens" validate constraint "mensagens_chat_id_fkey";

alter table "public"."mensagens" add constraint "mensagens_direcao_check" CHECK ((direcao = ANY (ARRAY['entrada'::text, 'saida'::text]))) not valid;

alter table "public"."mensagens" validate constraint "mensagens_direcao_check";

alter table "public"."mensagens" add constraint "mensagens_status_envio_check" CHECK ((status_envio = ANY (ARRAY['pendente'::text, 'enviada'::text, 'entregue'::text, 'lida'::text, 'falha'::text]))) not valid;

alter table "public"."mensagens" validate constraint "mensagens_status_envio_check";

alter table "public"."mensagens" add constraint "mensagens_tipo_check" CHECK ((tipo = ANY (ARRAY['texto'::text, 'audio'::text, 'imagem'::text, 'video'::text, 'documento'::text, 'botao'::text, 'lista'::text, 'sistema'::text]))) not valid;

alter table "public"."mensagens" validate constraint "mensagens_tipo_check";

alter table "public"."oportunidades" add constraint "oportunidades_conexao_origem_id_fkey" FOREIGN KEY (conexao_origem_id) REFERENCES public.conexoes(id) ON DELETE SET NULL not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_conexao_origem_id_fkey";

alter table "public"."oportunidades" add constraint "oportunidades_contato_id_fkey" FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE CASCADE not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_contato_id_fkey";

alter table "public"."oportunidades" add constraint "oportunidades_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_empresa_id_fkey";

alter table "public"."oportunidades" add constraint "oportunidades_equipe_id_fkey" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_equipe_id_fkey";

alter table "public"."oportunidades" add constraint "oportunidades_filial_id_fkey" FOREIGN KEY (filial_id) REFERENCES public.filiais(id) ON DELETE SET NULL not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_filial_id_fkey";

alter table "public"."oportunidades" add constraint "oportunidades_linha_negocio_check" CHECK ((linha_negocio = ANY (ARRAY['venda'::text, 'aluguel'::text]))) not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_linha_negocio_check";

alter table "public"."oportunidades" add constraint "oportunidades_status_check" CHECK ((status = ANY (ARRAY['aberta'::text, 'qualificando'::text, 'em_atendimento'::text, 'ganha'::text, 'perdida'::text, 'arquivada'::text]))) not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_status_check";

alter table "public"."oportunidades" add constraint "oportunidades_usuario_responsavel_id_fkey" FOREIGN KEY (usuario_responsavel_id) REFERENCES public.usuarios(id) ON DELETE SET NULL not valid;

alter table "public"."oportunidades" validate constraint "oportunidades_usuario_responsavel_id_fkey";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_acao_check" CHECK ((acao = ANY (ARRAY['abrir_chat'::text, 'ignorar'::text, 'encaminhar_humano'::text]))) not valid;

alter table "public"."regras_roteamento" validate constraint "regras_roteamento_acao_check";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_agente_ia_destino_id_fkey" FOREIGN KEY (agente_ia_destino_id) REFERENCES public.agentes_ia(id) ON DELETE SET NULL not valid;

alter table "public"."regras_roteamento" validate constraint "regras_roteamento_agente_ia_destino_id_fkey";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_conexao_id_fkey" FOREIGN KEY (conexao_id) REFERENCES public.conexoes(id) ON DELETE CASCADE not valid;

alter table "public"."regras_roteamento" validate constraint "regras_roteamento_conexao_id_fkey";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_conexao_id_prioridade_key" UNIQUE using index "regras_roteamento_conexao_id_prioridade_key";

alter table "public"."regras_roteamento" add constraint "regras_roteamento_equipe_destino_id_fkey" FOREIGN KEY (equipe_destino_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."regras_roteamento" validate constraint "regras_roteamento_equipe_destino_id_fkey";

alter table "public"."usuarios" add constraint "usuarios_empresa_id_email_key" UNIQUE using index "usuarios_empresa_id_email_key";

alter table "public"."usuarios" add constraint "usuarios_empresa_id_fkey" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE not valid;

alter table "public"."usuarios" validate constraint "usuarios_empresa_id_fkey";

alter table "public"."usuarios" add constraint "usuarios_equipe_id_fkey" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE SET NULL not valid;

alter table "public"."usuarios" validate constraint "usuarios_equipe_id_fkey";

alter table "public"."usuarios" add constraint "usuarios_papel_check" CHECK ((papel = ANY (ARRAY['admin'::text, 'gestor'::text, 'atendente'::text]))) not valid;

alter table "public"."usuarios" validate constraint "usuarios_papel_check";

grant delete on table "public"."agentes_ia" to "anon";

grant insert on table "public"."agentes_ia" to "anon";

grant references on table "public"."agentes_ia" to "anon";

grant select on table "public"."agentes_ia" to "anon";

grant trigger on table "public"."agentes_ia" to "anon";

grant truncate on table "public"."agentes_ia" to "anon";

grant update on table "public"."agentes_ia" to "anon";

grant delete on table "public"."agentes_ia" to "authenticated";

grant insert on table "public"."agentes_ia" to "authenticated";

grant references on table "public"."agentes_ia" to "authenticated";

grant select on table "public"."agentes_ia" to "authenticated";

grant trigger on table "public"."agentes_ia" to "authenticated";

grant truncate on table "public"."agentes_ia" to "authenticated";

grant update on table "public"."agentes_ia" to "authenticated";

grant delete on table "public"."agentes_ia" to "saluadmin";

grant insert on table "public"."agentes_ia" to "saluadmin";

grant select on table "public"."agentes_ia" to "saluadmin";

grant update on table "public"."agentes_ia" to "saluadmin";

grant delete on table "public"."agentes_ia" to "service_role";

grant insert on table "public"."agentes_ia" to "service_role";

grant references on table "public"."agentes_ia" to "service_role";

grant select on table "public"."agentes_ia" to "service_role";

grant trigger on table "public"."agentes_ia" to "service_role";

grant truncate on table "public"."agentes_ia" to "service_role";

grant update on table "public"."agentes_ia" to "service_role";

grant delete on table "public"."alembic_version" to "anon";

grant insert on table "public"."alembic_version" to "anon";

grant references on table "public"."alembic_version" to "anon";

grant select on table "public"."alembic_version" to "anon";

grant trigger on table "public"."alembic_version" to "anon";

grant truncate on table "public"."alembic_version" to "anon";

grant update on table "public"."alembic_version" to "anon";

grant delete on table "public"."alembic_version" to "authenticated";

grant insert on table "public"."alembic_version" to "authenticated";

grant references on table "public"."alembic_version" to "authenticated";

grant select on table "public"."alembic_version" to "authenticated";

grant trigger on table "public"."alembic_version" to "authenticated";

grant truncate on table "public"."alembic_version" to "authenticated";

grant update on table "public"."alembic_version" to "authenticated";

grant delete on table "public"."alembic_version" to "saluadmin";

grant insert on table "public"."alembic_version" to "saluadmin";

grant select on table "public"."alembic_version" to "saluadmin";

grant update on table "public"."alembic_version" to "saluadmin";

grant delete on table "public"."alembic_version" to "service_role";

grant insert on table "public"."alembic_version" to "service_role";

grant references on table "public"."alembic_version" to "service_role";

grant select on table "public"."alembic_version" to "service_role";

grant trigger on table "public"."alembic_version" to "service_role";

grant truncate on table "public"."alembic_version" to "service_role";

grant update on table "public"."alembic_version" to "service_role";

grant delete on table "public"."cadence_execucoes" to "anon";

grant insert on table "public"."cadence_execucoes" to "anon";

grant references on table "public"."cadence_execucoes" to "anon";

grant select on table "public"."cadence_execucoes" to "anon";

grant trigger on table "public"."cadence_execucoes" to "anon";

grant truncate on table "public"."cadence_execucoes" to "anon";

grant update on table "public"."cadence_execucoes" to "anon";

grant delete on table "public"."cadence_execucoes" to "authenticated";

grant insert on table "public"."cadence_execucoes" to "authenticated";

grant references on table "public"."cadence_execucoes" to "authenticated";

grant select on table "public"."cadence_execucoes" to "authenticated";

grant trigger on table "public"."cadence_execucoes" to "authenticated";

grant truncate on table "public"."cadence_execucoes" to "authenticated";

grant update on table "public"."cadence_execucoes" to "authenticated";

grant delete on table "public"."cadence_execucoes" to "saluadmin";

grant insert on table "public"."cadence_execucoes" to "saluadmin";

grant select on table "public"."cadence_execucoes" to "saluadmin";

grant update on table "public"."cadence_execucoes" to "saluadmin";

grant delete on table "public"."cadence_execucoes" to "service_role";

grant insert on table "public"."cadence_execucoes" to "service_role";

grant references on table "public"."cadence_execucoes" to "service_role";

grant select on table "public"."cadence_execucoes" to "service_role";

grant trigger on table "public"."cadence_execucoes" to "service_role";

grant truncate on table "public"."cadence_execucoes" to "service_role";

grant update on table "public"."cadence_execucoes" to "service_role";

grant delete on table "public"."cadence_fluxos" to "anon";

grant insert on table "public"."cadence_fluxos" to "anon";

grant references on table "public"."cadence_fluxos" to "anon";

grant select on table "public"."cadence_fluxos" to "anon";

grant trigger on table "public"."cadence_fluxos" to "anon";

grant truncate on table "public"."cadence_fluxos" to "anon";

grant update on table "public"."cadence_fluxos" to "anon";

grant delete on table "public"."cadence_fluxos" to "authenticated";

grant insert on table "public"."cadence_fluxos" to "authenticated";

grant references on table "public"."cadence_fluxos" to "authenticated";

grant select on table "public"."cadence_fluxos" to "authenticated";

grant trigger on table "public"."cadence_fluxos" to "authenticated";

grant truncate on table "public"."cadence_fluxos" to "authenticated";

grant update on table "public"."cadence_fluxos" to "authenticated";

grant delete on table "public"."cadence_fluxos" to "saluadmin";

grant insert on table "public"."cadence_fluxos" to "saluadmin";

grant select on table "public"."cadence_fluxos" to "saluadmin";

grant update on table "public"."cadence_fluxos" to "saluadmin";

grant delete on table "public"."cadence_fluxos" to "service_role";

grant insert on table "public"."cadence_fluxos" to "service_role";

grant references on table "public"."cadence_fluxos" to "service_role";

grant select on table "public"."cadence_fluxos" to "service_role";

grant trigger on table "public"."cadence_fluxos" to "service_role";

grant truncate on table "public"."cadence_fluxos" to "service_role";

grant update on table "public"."cadence_fluxos" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "saluadmin";

grant insert on table "public"."chats" to "saluadmin";

grant select on table "public"."chats" to "saluadmin";

grant update on table "public"."chats" to "saluadmin";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."conexoes" to "anon";

grant insert on table "public"."conexoes" to "anon";

grant references on table "public"."conexoes" to "anon";

grant select on table "public"."conexoes" to "anon";

grant trigger on table "public"."conexoes" to "anon";

grant truncate on table "public"."conexoes" to "anon";

grant update on table "public"."conexoes" to "anon";

grant delete on table "public"."conexoes" to "authenticated";

grant insert on table "public"."conexoes" to "authenticated";

grant references on table "public"."conexoes" to "authenticated";

grant select on table "public"."conexoes" to "authenticated";

grant trigger on table "public"."conexoes" to "authenticated";

grant truncate on table "public"."conexoes" to "authenticated";

grant update on table "public"."conexoes" to "authenticated";

grant delete on table "public"."conexoes" to "saluadmin";

grant insert on table "public"."conexoes" to "saluadmin";

grant select on table "public"."conexoes" to "saluadmin";

grant update on table "public"."conexoes" to "saluadmin";

grant delete on table "public"."conexoes" to "service_role";

grant insert on table "public"."conexoes" to "service_role";

grant references on table "public"."conexoes" to "service_role";

grant select on table "public"."conexoes" to "service_role";

grant trigger on table "public"."conexoes" to "service_role";

grant truncate on table "public"."conexoes" to "service_role";

grant update on table "public"."conexoes" to "service_role";

grant delete on table "public"."contatos" to "anon";

grant insert on table "public"."contatos" to "anon";

grant references on table "public"."contatos" to "anon";

grant select on table "public"."contatos" to "anon";

grant trigger on table "public"."contatos" to "anon";

grant truncate on table "public"."contatos" to "anon";

grant update on table "public"."contatos" to "anon";

grant delete on table "public"."contatos" to "authenticated";

grant insert on table "public"."contatos" to "authenticated";

grant references on table "public"."contatos" to "authenticated";

grant select on table "public"."contatos" to "authenticated";

grant trigger on table "public"."contatos" to "authenticated";

grant truncate on table "public"."contatos" to "authenticated";

grant update on table "public"."contatos" to "authenticated";

grant delete on table "public"."contatos" to "saluadmin";

grant insert on table "public"."contatos" to "saluadmin";

grant select on table "public"."contatos" to "saluadmin";

grant update on table "public"."contatos" to "saluadmin";

grant delete on table "public"."contatos" to "service_role";

grant insert on table "public"."contatos" to "service_role";

grant references on table "public"."contatos" to "service_role";

grant select on table "public"."contatos" to "service_role";

grant trigger on table "public"."contatos" to "service_role";

grant truncate on table "public"."contatos" to "service_role";

grant update on table "public"."contatos" to "service_role";

grant delete on table "public"."empresas" to "anon";

grant insert on table "public"."empresas" to "anon";

grant references on table "public"."empresas" to "anon";

grant select on table "public"."empresas" to "anon";

grant trigger on table "public"."empresas" to "anon";

grant truncate on table "public"."empresas" to "anon";

grant update on table "public"."empresas" to "anon";

grant delete on table "public"."empresas" to "authenticated";

grant insert on table "public"."empresas" to "authenticated";

grant references on table "public"."empresas" to "authenticated";

grant select on table "public"."empresas" to "authenticated";

grant trigger on table "public"."empresas" to "authenticated";

grant truncate on table "public"."empresas" to "authenticated";

grant update on table "public"."empresas" to "authenticated";

grant delete on table "public"."empresas" to "saluadmin";

grant insert on table "public"."empresas" to "saluadmin";

grant select on table "public"."empresas" to "saluadmin";

grant update on table "public"."empresas" to "saluadmin";

grant delete on table "public"."empresas" to "service_role";

grant insert on table "public"."empresas" to "service_role";

grant references on table "public"."empresas" to "service_role";

grant select on table "public"."empresas" to "service_role";

grant trigger on table "public"."empresas" to "service_role";

grant truncate on table "public"."empresas" to "service_role";

grant update on table "public"."empresas" to "service_role";

grant delete on table "public"."equipes" to "anon";

grant insert on table "public"."equipes" to "anon";

grant references on table "public"."equipes" to "anon";

grant select on table "public"."equipes" to "anon";

grant trigger on table "public"."equipes" to "anon";

grant truncate on table "public"."equipes" to "anon";

grant update on table "public"."equipes" to "anon";

grant delete on table "public"."equipes" to "authenticated";

grant insert on table "public"."equipes" to "authenticated";

grant references on table "public"."equipes" to "authenticated";

grant select on table "public"."equipes" to "authenticated";

grant trigger on table "public"."equipes" to "authenticated";

grant truncate on table "public"."equipes" to "authenticated";

grant update on table "public"."equipes" to "authenticated";

grant delete on table "public"."equipes" to "saluadmin";

grant insert on table "public"."equipes" to "saluadmin";

grant select on table "public"."equipes" to "saluadmin";

grant update on table "public"."equipes" to "saluadmin";

grant delete on table "public"."equipes" to "service_role";

grant insert on table "public"."equipes" to "service_role";

grant references on table "public"."equipes" to "service_role";

grant select on table "public"."equipes" to "service_role";

grant trigger on table "public"."equipes" to "service_role";

grant truncate on table "public"."equipes" to "service_role";

grant update on table "public"."equipes" to "service_role";

grant delete on table "public"."eventos_webhook" to "anon";

grant insert on table "public"."eventos_webhook" to "anon";

grant references on table "public"."eventos_webhook" to "anon";

grant select on table "public"."eventos_webhook" to "anon";

grant trigger on table "public"."eventos_webhook" to "anon";

grant truncate on table "public"."eventos_webhook" to "anon";

grant update on table "public"."eventos_webhook" to "anon";

grant delete on table "public"."eventos_webhook" to "authenticated";

grant insert on table "public"."eventos_webhook" to "authenticated";

grant references on table "public"."eventos_webhook" to "authenticated";

grant select on table "public"."eventos_webhook" to "authenticated";

grant trigger on table "public"."eventos_webhook" to "authenticated";

grant truncate on table "public"."eventos_webhook" to "authenticated";

grant update on table "public"."eventos_webhook" to "authenticated";

grant delete on table "public"."eventos_webhook" to "saluadmin";

grant insert on table "public"."eventos_webhook" to "saluadmin";

grant select on table "public"."eventos_webhook" to "saluadmin";

grant update on table "public"."eventos_webhook" to "saluadmin";

grant delete on table "public"."eventos_webhook" to "service_role";

grant insert on table "public"."eventos_webhook" to "service_role";

grant references on table "public"."eventos_webhook" to "service_role";

grant select on table "public"."eventos_webhook" to "service_role";

grant trigger on table "public"."eventos_webhook" to "service_role";

grant truncate on table "public"."eventos_webhook" to "service_role";

grant update on table "public"."eventos_webhook" to "service_role";

grant delete on table "public"."filiais" to "anon";

grant insert on table "public"."filiais" to "anon";

grant references on table "public"."filiais" to "anon";

grant select on table "public"."filiais" to "anon";

grant trigger on table "public"."filiais" to "anon";

grant truncate on table "public"."filiais" to "anon";

grant update on table "public"."filiais" to "anon";

grant delete on table "public"."filiais" to "authenticated";

grant insert on table "public"."filiais" to "authenticated";

grant references on table "public"."filiais" to "authenticated";

grant select on table "public"."filiais" to "authenticated";

grant trigger on table "public"."filiais" to "authenticated";

grant truncate on table "public"."filiais" to "authenticated";

grant update on table "public"."filiais" to "authenticated";

grant delete on table "public"."filiais" to "saluadmin";

grant insert on table "public"."filiais" to "saluadmin";

grant select on table "public"."filiais" to "saluadmin";

grant update on table "public"."filiais" to "saluadmin";

grant delete on table "public"."filiais" to "service_role";

grant insert on table "public"."filiais" to "service_role";

grant references on table "public"."filiais" to "service_role";

grant select on table "public"."filiais" to "service_role";

grant trigger on table "public"."filiais" to "service_role";

grant truncate on table "public"."filiais" to "service_role";

grant update on table "public"."filiais" to "service_role";

grant delete on table "public"."imoveis" to "anon";

grant insert on table "public"."imoveis" to "anon";

grant references on table "public"."imoveis" to "anon";

grant select on table "public"."imoveis" to "anon";

grant trigger on table "public"."imoveis" to "anon";

grant truncate on table "public"."imoveis" to "anon";

grant update on table "public"."imoveis" to "anon";

grant delete on table "public"."imoveis" to "authenticated";

grant insert on table "public"."imoveis" to "authenticated";

grant references on table "public"."imoveis" to "authenticated";

grant select on table "public"."imoveis" to "authenticated";

grant trigger on table "public"."imoveis" to "authenticated";

grant truncate on table "public"."imoveis" to "authenticated";

grant update on table "public"."imoveis" to "authenticated";

grant delete on table "public"."imoveis" to "saluadmin";

grant insert on table "public"."imoveis" to "saluadmin";

grant select on table "public"."imoveis" to "saluadmin";

grant update on table "public"."imoveis" to "saluadmin";

grant delete on table "public"."imoveis" to "service_role";

grant insert on table "public"."imoveis" to "service_role";

grant references on table "public"."imoveis" to "service_role";

grant select on table "public"."imoveis" to "service_role";

grant trigger on table "public"."imoveis" to "service_role";

grant truncate on table "public"."imoveis" to "service_role";

grant update on table "public"."imoveis" to "service_role";

grant delete on table "public"."interesses_imovel" to "anon";

grant insert on table "public"."interesses_imovel" to "anon";

grant references on table "public"."interesses_imovel" to "anon";

grant select on table "public"."interesses_imovel" to "anon";

grant trigger on table "public"."interesses_imovel" to "anon";

grant truncate on table "public"."interesses_imovel" to "anon";

grant update on table "public"."interesses_imovel" to "anon";

grant delete on table "public"."interesses_imovel" to "authenticated";

grant insert on table "public"."interesses_imovel" to "authenticated";

grant references on table "public"."interesses_imovel" to "authenticated";

grant select on table "public"."interesses_imovel" to "authenticated";

grant trigger on table "public"."interesses_imovel" to "authenticated";

grant truncate on table "public"."interesses_imovel" to "authenticated";

grant update on table "public"."interesses_imovel" to "authenticated";

grant delete on table "public"."interesses_imovel" to "saluadmin";

grant insert on table "public"."interesses_imovel" to "saluadmin";

grant select on table "public"."interesses_imovel" to "saluadmin";

grant update on table "public"."interesses_imovel" to "saluadmin";

grant delete on table "public"."interesses_imovel" to "service_role";

grant insert on table "public"."interesses_imovel" to "service_role";

grant references on table "public"."interesses_imovel" to "service_role";

grant select on table "public"."interesses_imovel" to "service_role";

grant trigger on table "public"."interesses_imovel" to "service_role";

grant truncate on table "public"."interesses_imovel" to "service_role";

grant update on table "public"."interesses_imovel" to "service_role";

grant delete on table "public"."mensagens" to "anon";

grant insert on table "public"."mensagens" to "anon";

grant references on table "public"."mensagens" to "anon";

grant select on table "public"."mensagens" to "anon";

grant trigger on table "public"."mensagens" to "anon";

grant truncate on table "public"."mensagens" to "anon";

grant update on table "public"."mensagens" to "anon";

grant delete on table "public"."mensagens" to "authenticated";

grant insert on table "public"."mensagens" to "authenticated";

grant references on table "public"."mensagens" to "authenticated";

grant select on table "public"."mensagens" to "authenticated";

grant trigger on table "public"."mensagens" to "authenticated";

grant truncate on table "public"."mensagens" to "authenticated";

grant update on table "public"."mensagens" to "authenticated";

grant delete on table "public"."mensagens" to "saluadmin";

grant insert on table "public"."mensagens" to "saluadmin";

grant select on table "public"."mensagens" to "saluadmin";

grant update on table "public"."mensagens" to "saluadmin";

grant delete on table "public"."mensagens" to "service_role";

grant insert on table "public"."mensagens" to "service_role";

grant references on table "public"."mensagens" to "service_role";

grant select on table "public"."mensagens" to "service_role";

grant trigger on table "public"."mensagens" to "service_role";

grant truncate on table "public"."mensagens" to "service_role";

grant update on table "public"."mensagens" to "service_role";

grant delete on table "public"."oportunidades" to "anon";

grant insert on table "public"."oportunidades" to "anon";

grant references on table "public"."oportunidades" to "anon";

grant select on table "public"."oportunidades" to "anon";

grant trigger on table "public"."oportunidades" to "anon";

grant truncate on table "public"."oportunidades" to "anon";

grant update on table "public"."oportunidades" to "anon";

grant delete on table "public"."oportunidades" to "authenticated";

grant insert on table "public"."oportunidades" to "authenticated";

grant references on table "public"."oportunidades" to "authenticated";

grant select on table "public"."oportunidades" to "authenticated";

grant trigger on table "public"."oportunidades" to "authenticated";

grant truncate on table "public"."oportunidades" to "authenticated";

grant update on table "public"."oportunidades" to "authenticated";

grant delete on table "public"."oportunidades" to "saluadmin";

grant insert on table "public"."oportunidades" to "saluadmin";

grant select on table "public"."oportunidades" to "saluadmin";

grant update on table "public"."oportunidades" to "saluadmin";

grant delete on table "public"."oportunidades" to "service_role";

grant insert on table "public"."oportunidades" to "service_role";

grant references on table "public"."oportunidades" to "service_role";

grant select on table "public"."oportunidades" to "service_role";

grant trigger on table "public"."oportunidades" to "service_role";

grant truncate on table "public"."oportunidades" to "service_role";

grant update on table "public"."oportunidades" to "service_role";

grant delete on table "public"."regras_roteamento" to "anon";

grant insert on table "public"."regras_roteamento" to "anon";

grant references on table "public"."regras_roteamento" to "anon";

grant select on table "public"."regras_roteamento" to "anon";

grant trigger on table "public"."regras_roteamento" to "anon";

grant truncate on table "public"."regras_roteamento" to "anon";

grant update on table "public"."regras_roteamento" to "anon";

grant delete on table "public"."regras_roteamento" to "authenticated";

grant insert on table "public"."regras_roteamento" to "authenticated";

grant references on table "public"."regras_roteamento" to "authenticated";

grant select on table "public"."regras_roteamento" to "authenticated";

grant trigger on table "public"."regras_roteamento" to "authenticated";

grant truncate on table "public"."regras_roteamento" to "authenticated";

grant update on table "public"."regras_roteamento" to "authenticated";

grant delete on table "public"."regras_roteamento" to "saluadmin";

grant insert on table "public"."regras_roteamento" to "saluadmin";

grant select on table "public"."regras_roteamento" to "saluadmin";

grant update on table "public"."regras_roteamento" to "saluadmin";

grant delete on table "public"."regras_roteamento" to "service_role";

grant insert on table "public"."regras_roteamento" to "service_role";

grant references on table "public"."regras_roteamento" to "service_role";

grant select on table "public"."regras_roteamento" to "service_role";

grant trigger on table "public"."regras_roteamento" to "service_role";

grant truncate on table "public"."regras_roteamento" to "service_role";

grant update on table "public"."regras_roteamento" to "service_role";

grant delete on table "public"."usuarios" to "anon";

grant insert on table "public"."usuarios" to "anon";

grant references on table "public"."usuarios" to "anon";

grant select on table "public"."usuarios" to "anon";

grant trigger on table "public"."usuarios" to "anon";

grant truncate on table "public"."usuarios" to "anon";

grant update on table "public"."usuarios" to "anon";

grant delete on table "public"."usuarios" to "authenticated";

grant insert on table "public"."usuarios" to "authenticated";

grant references on table "public"."usuarios" to "authenticated";

grant select on table "public"."usuarios" to "authenticated";

grant trigger on table "public"."usuarios" to "authenticated";

grant truncate on table "public"."usuarios" to "authenticated";

grant update on table "public"."usuarios" to "authenticated";

grant delete on table "public"."usuarios" to "saluadmin";

grant insert on table "public"."usuarios" to "saluadmin";

grant select on table "public"."usuarios" to "saluadmin";

grant update on table "public"."usuarios" to "saluadmin";

grant delete on table "public"."usuarios" to "service_role";

grant insert on table "public"."usuarios" to "service_role";

grant references on table "public"."usuarios" to "service_role";

grant select on table "public"."usuarios" to "service_role";

grant trigger on table "public"."usuarios" to "service_role";

grant truncate on table "public"."usuarios" to "service_role";

grant update on table "public"."usuarios" to "service_role";


