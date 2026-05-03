# Desk-yura

Plataforma SaaS de apoio jurídico com análise de demandas por IA (Claude) e revisão humana obrigatória.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker | 20+ | `docker --version` |

---

## Estrutura do projeto

```
desk-yura/
├── src/              # Backend NestJS (porta 3000)
├── frontend/         # Frontend Next.js (porta 3001)
├── prisma/           # Schema e migrations
├── uploads/          # Arquivos enviados pelos usuários
└── .env              # Variáveis de ambiente do backend
```

---

## 1. Clonar e instalar dependências

```bash
# Backend
npm install

# Frontend
cd frontend && npm install && cd ..
```

---

## 2. Variáveis de ambiente

O arquivo `.env` já está na raiz do projeto com valores padrão para desenvolvimento. Edite conforme necessário:

```bash
# .env — campos obrigatórios para funcionamento completo

ANTHROPIC_API_KEY=sk-ant-...   # Necessário para análise de IA real
```

Os demais campos (banco, JWT, Redis) já têm valores padrão prontos para desenvolvimento local.

---

## 3. Subir o banco de dados (PostgreSQL via Docker)

```bash
docker run -d \
  --name desk-yura-postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=desk_yura \
  -p 5432:5432 \
  postgres:16
```

Verificar se está rodando:

```bash
docker ps | grep desk-yura-postgres
```

---

## 4. Criar as tabelas e popular o banco

```bash
# Aplicar todas as migrations
npm run db:migrate

# Abrir o Prisma Studio (opcional — interface visual do banco)
npm run db:studio
```

---

## 5. Criar usuários iniciais

Execute o script abaixo para criar os 4 tipos de usuário para testes:

```bash
node -e "
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash('desk@2024', 10);

  await p.user.upsert({
    where: { email: 'admin@deskyura.com' },
    update: {},
    create: {
      email: 'admin@deskyura.com', passwordHash: hash,
      role: 'SUPERADMIN', status: 'ACTIVE',
      firstName: 'Admin', lastName: 'Sistema',
    },
  });

  await p.user.upsert({
    where: { email: 'advogado@deskyura.com' },
    update: {},
    create: {
      email: 'advogado@deskyura.com', passwordHash: hash,
      role: 'LAWYER', status: 'ACTIVE',
      firstName: 'João', lastName: 'Advogado',
      lawyerProfile: {
        create: { oabNumber: 'SP123456', oabState: 'SP', specialties: [] },
      },
    },
  });

  await p.user.upsert({
    where: { email: 'revisor@deskyura.com' },
    update: {},
    create: {
      email: 'revisor@deskyura.com', passwordHash: hash,
      role: 'REVIEWER', status: 'ACTIVE',
      firstName: 'Maria', lastName: 'Revisora',
      reviewerProfile: {
        create: { specialties: [] },
      },
    },
  });

  await p.user.upsert({
    where: { email: 'cliente@deskyura.com' },
    update: {},
    create: {
      email: 'cliente@deskyura.com', passwordHash: hash,
      role: 'CLIENT', status: 'ACTIVE',
      firstName: 'Carlos', lastName: 'Cliente',
    },
  });

  console.log('Usuários criados com sucesso.');
  await p.\$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
"
```

---

## 6. Subir o backend

```bash
# Modo desenvolvimento (hot-reload)
npm run start:dev
```

O backend estará disponível em:
- API: `http://localhost:3000/api/v1`
- Swagger (documentação): `http://localhost:3000/api/docs`

---

## 7. Subir o frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:3001`.

---

## Credenciais de acesso

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@deskyura.com` | `desk@2024` |
| Advogado | `advogado@deskyura.com` | `desk@2024` |
| Revisor | `revisor@deskyura.com` | `desk@2024` |
| Cliente | `cliente@deskyura.com` | `desk@2024` |

---

## Fluxo de uso

```
Advogado cadastra cliente
       ↓
Advogado cria demanda (rascunho)
       ↓
Advogado submete para análise
       ↓
IA analisa (Claude) → PENDING_REVIEW
       ↓
Revisor assume da fila
       ↓
Revisor edita análise + aprova ou rejeita
       ↓
Cliente visualiza resultado final
```

O botão **"Analisar com IA"** no painel admin permite disparar análises mock sem precisar de chave Anthropic.

---

## Comandos úteis

```bash
# Backend
npm run start:dev          # Subir em modo dev
npm run build              # Compilar para produção
npm run db:migrate         # Rodar migrations pendentes
npm run db:studio          # Interface visual do banco (Prisma Studio)

# Frontend
cd frontend
npm run dev                # Subir em modo dev
npm run build              # Build de produção
npm run start              # Subir build de produção

# Docker
docker start desk-yura-postgres    # Iniciar banco parado
docker stop desk-yura-postgres     # Parar banco
docker logs desk-yura-postgres     # Ver logs do banco
```

---

## Solução de problemas

**Porta já em uso**
```bash
# Matar processo na porta 3000 (backend)
lsof -ti :3000 | xargs kill -9

# Matar processo na porta 3001 (frontend)
lsof -ti :3001 | xargs kill -9
```

**Frontend com erro 500 nos assets estáticos**
```bash
cd frontend
rm -rf .next
npm run dev
```

**Banco de dados não conecta**
```bash
# Verificar se o container está rodando
docker ps | grep desk-yura-postgres

# Reiniciar se necessário
docker start desk-yura-postgres
```

**Resetar senha de um usuário**
```bash
node -e "
const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
bcrypt.hash('desk@2024', 10)
  .then(h => p.user.updateMany({ data: { passwordHash: h } }))
  .then(r => console.log('Senhas resetadas:', r.count, 'usuários'))
  .finally(() => p.\$disconnect());
"
```
