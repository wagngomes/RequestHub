# Projeto: [Hub Request Plan]

## Visão geral
É um portal similar a um potal de chamados, onde usuários entram e abrem solicitações para o time d planejamento, existem 2 tipos de solicitações:
- Solicitações de transferências entre Centros de distribuição
- Solicitações de liberação de faturamento pelo "sistema pitágoras"

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM (com SQLITE)
- Zod (para validação de todas as entradas)
- Componentes shadcn
- BetterAuth para autenticação
- resend para envio de emails
- Docker (Dokcer file da aplicação)

## Comandos
- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes

## Convenções de código
- Componentes em PascalCase, arquivos kebab-case
- Server Components por padrão; usar `"use client"` só quando necessário
- Imports absolutos com alias `@/`
- Sempre tipar retornos de funções exportadas
- Não usar `any`

## Workflow
- Branch principal: `main`
- Sempre criar branch para features: `feat/nome-da-feature`
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `chore:`)

## Regras importantes para o Claude
- NÃO commitar arquivos `.env*` (já estão no `.gitignore`)
- Sempre que criar uma rota nova, adicionar tipagem nos params/searchParams
- Preferir editar arquivos existentes a criar novos
- Se uma tarefa não estiver clara, perguntar antes de codar
- Sempre inserir paginação nas tabelas 

## Paginas da aplicação
- Tela de login com opção de entrar ou criar uma nova conta ( aberta para todos)
- Tela inicial ( somente com autenticação de usuário) com 2 cards , depois com mais funções serão adicionados mais cards
- Card solicitação de transferencias
- Card solicitação de liberação Pitágoras
- Esses cards levam para a tela principal que contem uma tabela e o botão para inserir novo.

## Models da aplicação

enum Role {
  ADMIN
  USER
}

enum Sn {
  S
  N
}

enum Status {
    PENDENTE
    PROCESSADA
}

enum Sistama {
    MONEY
    SALESFORCE
    MONEY | SALESFORCE
}

enum Acao {
    HABILITAR
    DESABILITAR
}

enum Retorno {
    APROVADA
    REPROVADA
}

enum Setor {
    PLANEJAMENTO
    COMERCIAL
    OPERAÇÕES
    OUTRO
}


Model User :
    id            String    @id @default(cuid())
    email         String    @unique
    nome          String
    role          Role      @default(USER) // ⚠️ default seguro
    setor         Setor
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt


Model Product :
    codigo      String  @id @unique
    descricao   String
    marca       String
    refrigerado Sn
    controlado  Sn
    cmv         Float @default(0)

Model Transferencias  :
    codigo          String
    descricao       String
    controlado      Sn
    refrigerado     Sn
    origem          String
    destino         String
    quantidade      int
    userId          
    createdaAt      DateTime  @default(now())
    updatedAt       DateTime  @updatedAt
    status          Status

Model liberacao :
    email           String
    solicitante     String
    data            DateTime  @default(now())
    grupo           String
    contrato        String
    codigo          String
    descricao       String
    contribuinte    Sn
    cliente_UF      String
    Centro          String
    CNPJ_COD        String
    grupo_2         String
    quantidade      Int
    valor           Float
    link_pedido_compl   String
    representante       String
    money_salesforce    Sistema
    acao                Acao
    retorno_planejamento Retorno
    status              Status
    obs:                String
    createdaAt              DateTime  @default(now())
    updatedAt               DateTime  @updatedAt
    UserId

- Relações que não estão descritas acima codigo do poduto em todas as tabelas , userId

## Rotas da aplicação 

### TELA LOGIN
 - POST (criar usuário)
 - PATCH (atualizar dados do usuário)
 - POST (login usuário)


### TELA INICIAL
 - REDIRECIONA PARA TELA DE TRANSFERENCIAS 
 - REDUIRECIONA PARA TELA DE SLICITAÇÕES
 - UPLOAD D CSV para popular a tabela de produtos (disponíve somente para usuários do planejamento)

### TELA TRANSFERENCIAS
 - POST (solicitar transferencia)
 - PATCH (atualizar status das transferencias)
 - GET ( buscar todas as transferencias por usuário)
 - GET ( buscar todas as transferencias por status)
 - GET ( buscar todas as transferencias)

### TELA LIBERAÇÃO
 - POST (solicitar liberação)
 - PATCH( atualizar retorno do planejamento das solicitações)
 - GET ( buscar todas as liberações por usuário)
 - GET ( buscar todas as transferenc por status)
 - GET ( buscar todas as transferencias)

- Somente usuários do setor de planejamento podem atualizar status das transferencias e retono do planejamento das solicitações 
- Somente usuários do planejamento podem listar todos os registros

- Nas tabelas deve ter um campo com actins buttons, onde o usuário pode abrir o formularioe ver todas as informação dasquela linha , editar ou excluir.

- As tabelas devem ter campos de busca e opção de selecionar as colunas que devem ser exibidas.

- - Devemos ter um modal para cada tipo de solicitação


## Estilo 

- Paleta de cores sugerida
🟢 Verde-água (turquesa claro)#7FD9CDHeader, botão CTA, detalhes gráficos🟦 Azul-petróleo escuro#16455CLogo, títulos, textos principais⚪ Branco#FFFFFFFundo principal⚫ Cinza-grafite#2B2B2BTextos de navegação🟩 Verde escuro (scrub médico)#2E9B7CCor de apoio (presente na imagem)🩶 Cinza claro#F5F5F5Backgrounds secundários sugeridos

- Quero um perfil corporativo estilo sales force, nos cards transferencias e liberação , podem colocar imagem sugstiva

### task-01
- As solicitações de transferencia e de liberação de faturamento devem gerar um ID e esse ID deve ser o primeiro campo nas tabelas que mostram as solicitações.
- Gerar um ID com aprox 8 caracteres com as melhores práticas utilizadas no mercado.
- Cada solicitação tanto de transferencia quanto de liberação de faturamento , deve ter a opção no modal de incluir mais itens, porque uma unica solicitação pode ter até 20 itens, no modal deve ter a opção de incluir mais um item ou finalizar, e somente quando o usuário clica em finalizar ai sim deve ser gerado o ID, ou seja um ID pode ser uma solicitação com apenas um produto ou até 20 produtos.

### task-02
o Modal de solicitação de liberação precisa ter todos os campos para serem preenchidos, a descrição deve puxar automaticamente a´pos o usuário prencher o código.
A versão anterior do formulário estava completa, só faltava a questão de puxar a descrição de forma automática.

codigo          String
  descricao       String
  contribuinte    String   @default("N")
  clienteUF       String
  centro          String
  cnpjCod         String
  grupo2          String
  quantidade      Int
  valor           Float
  linkPedidoCompl

### task-03

- melhore o visual dos 2 modais ( transferencias e liberação) esta uma mistura de temas claros e escuros, deixe de acordo com o restante da aplicação 

### task-04

- A tabela de transferencias deve mostrar cada item ( no máximo 20) em uma linha, e repetir o ID na coluna inicial, o status realizado / pendente deve ser atibuido a cada item da tranasferencia e não ao Id , ou seja , eu posso ter uma solicitação de transferencias com 5 itens , 2 pendentes e 3 finalizados.

- o Mesmo vale para a tabela de solicitação de liberação.

### task-05
- No modal de solicitação de liberação o campo "Centro" deve puxar a mesma lista suspensa que usamos no Modal de transferencias no campo CD origem.

- No modal de solicitação de liberação o campo "UF" cliente, deve exibir uma lista suspensa com as opções de UF dos estados brasileiros. total de 27 UFS

### task-06

- Revisar as cores dos textos nos botões das paginas , modais e tabelas , alguns estão ficando invisíveis.

### task-07

- Criação da tela de ADMIM do sistema, nessa tela somente quem tem Role ADMIN pode entrar, nela terá o card para upload da tabela de produtos , que hoje esta na tela home, nela também terá a tabela com todos os usuários e o admin poderá editar todos os campos, inserir ou deletar usuários.
- Tabela de prosutos onde será possível ver o cadastro de produtos , filtrar por código e alterar os campos , incluir manualmente e excluir produtos

- Tabela com os centros cadastrados (const CENTROS_DISTRIBUICAO) , onde será possível ver os centros cadastrados, alterar , incluir e excluir 

### task-08

- Na tela de ADMIN criar um campo de texto, onde seja possivel inserir endereços de email separados por ponto e virgula, esse emails são de funcionários do planejamento que deverão ser notificado por email sempre que houver uma nova solicitação tantopde transferencia quanto de liberação por parte dos outros setores.

### task-09

- Incluir no model produto os campos abaixo:
    - tributacao String @default("-")
    - supridor   String @default("-")
    - multiplo   @default(1)

- Criar a model Sla:
- origem     String
- destino    String
- sla        int
- sigla_origem    String
- sigla_destino   String

- Na tabela da pagina de transferencias incluir o nome do supridor, supridor deve ser um filtro nessa tabela.

- Na tabela da pagina de transferncias incluir o SLA entre a filial origem e destino.

- inclua as alterações da model sla na pagina de admin , inclusive opção de upload de csv , assim como produtos 


### task-10

- colocar a opção de limpar a tabela de produtos, dar um delete geral nela na tela de admin 

### task-12
- Verificar e corrigir a cor do botão e do texto dos componentes abaixo:
- Botão de upload CSV na tela de ADMIN-produtos
- Botão de "cancelar" no form de solicitar transferencias
- Botão de "cancelar" no form de solicitar liberação
- os "..." dos campos de action buttons das tabelas de transferencias e liberações.

### task-13

- Na tabela da pagina de liberação, no formulario da ação "ver solicitação completa" inserir os seguintes campos:
    - Valor
    - Centro
    - UF do cliente 
    - CNPJ / Codigo

- No formulário de solicitação de transferências,ao digitar o código do item, puxar as seguintes informações:da mesma forma qua ja esta buscando a descrição.
    - Refrigerado
    - Controlado
    - Multiplo
    - Tributacao
- Criar a regra de verificação de multiplo:
   - Se a quantidade solicitada do produto não for multiplo do campo multiplo, não deixar ionserir e avisar o usuário para ajustar a quantidade do produto.

   exemplo :
    - multiplo : 50 
    - Permitido quanquer numero que na divisão por 50 tenha resto da divisão - zero
    - ex: 100 , 150, 1500, 50
    - exemplos de erros : 3, 75, 115 

- No painel de ADIMIN na parte de Notificações, separar as caixas de emails , pois para ações de transferencias um grupo de emails deve ser notificado e para açoes de liberação o grupo pode ser diferente.

- Revisar o fluxo de emails, as chaves de API ja estão preenchidas no .env , mas não esta chegando notificações por email.

- Inserir no email de aviso de nova solicitação de transferencia a informação "PREVISÃO DE CHEGADA" 
    - Essa informação será calculada da seguinte forma:
    - data da solicitação + SLA entre os cds de origem e destino em dias úiteis

