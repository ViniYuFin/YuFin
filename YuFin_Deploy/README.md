# 🎓 YüFin - MVP

**Plataforma de Educação Financeira Gamificada**

## 📋 Sobre o Projeto

O YüFin é uma plataforma educacional inovadora que ensina educação financeira de forma gamificada e interativa. Desenvolvido para estudantes do 6º ano do Ensino Fundamental ao 3º ano do Ensino Médio.

## ✨ Características Principais

### 🎮 **Gamificação Completa**
- Sistema de XP e níveis
- YüCoins como moeda virtual
- Conquistas e badges
- Streak de dias consecutivos

### 📚 **Conteúdo Personalizado**
- **84 lições** distribuídas em 7 séries
- **6 formatos diferentes**: Match, Drag & Drop, Budget Distribution, Goals, Quiz, Math Problems, Simulation
- Conteúdo adaptado por série e módulo
- Exemplos práticos e cenários reais

### 🎯 **Formatos de Lição**
- **Match**: Associação de conceitos
- **Drag & Drop**: Organização de elementos
- **Budget Distribution**: Distribuição de orçamento
- **Goals**: Definição de metas financeiras
- **Quiz**: Questionários interativos
- **Math Problems**: Problemas matemáticos
- **Simulation**: Simulações práticas

### 📱 **Design Responsivo**
- Otimizado para todas as telas
- Suporte a monitores ultrawide (2K/4K)
- Gradientes responsivos
- Interface adaptativa

## 🚀 Tecnologias Utilizadas

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Autenticação**: JWT
- **Animações**: Framer Motion
- **Ícones**: Emojis e símbolos Unicode

## 📊 Estrutura do Currículo

### **6º Ano** (12 lições)
- Fundamentos do dinheiro
- Orçamento básico
- Necessidades vs desejos

### **7º Ano** (12 lições)
- Categorização de gastos
- Primeiro orçamento
- Proteção contra golpes

### **8º Ano** (12 lições)
- Análise de gastos
- Crédito e financiamento
- Comparação de preços

### **9º Ano** (12 lições)
- Planejamento financeiro
- Investimentos básicos
- Tecnologia financeira

### **1º Ano EM** (12 lições)
- Finanças pessoais avançadas
- Renda fixa vs variável
- Taxas bancárias

### **2º Ano EM** (12 lições)
- Fintechs e blockchain
- Demonstrativos financeiros
- Mercados financeiros

### **3º Ano EM** (12 lições)
- Criptomoedas
- Decisões de investimento
- Economia sustentável

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (v16 ou superior)
- MongoDB
- Git

### Passos para instalação

1. **Clone o repositório**
```bash
git clone https://github.com/ViniYuFin/YuFin.git
cd YuFin
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute o projeto**
```bash
# Backend
npm run dev:backend

# Frontend (em outro terminal)
npm run dev:frontend
```

## 📁 Estrutura do Projeto

```
YuFin/
├── src/
│   ├── components/          # Componentes React
│   ├── styles/             # Estilos CSS
│   ├── utils/              # Utilitários
│   └── app.jsx             # Ponto de entrada
├── backend/
│   ├── routes/             # Rotas da API
│   ├── models/             # Modelos do MongoDB
│   ├── scripts/            # Scripts de personalização
│   └── server.js           # Servidor Express
├── dist/                   # Build de produção
└── public/                 # Arquivos estáticos
```

## 🎯 Funcionalidades Implementadas

### ✅ **Sistema de Autenticação**
- Login/Registro por tipo de usuário
- Tokens de acesso para alunos
- Proteção de rotas

### ✅ **Dashboard Interativo**
- Progresso visual por módulo
- Métricas de desempenho
- Navegação intuitiva

### ✅ **Sistema de Progressão**
- Desbloqueio sequencial de lições
- Rastreamento de conclusão
- Modo revisão

### ✅ **Personalização de Conteúdo**
- Scripts automatizados para personalização
- Conteúdo específico por série
- Exemplos contextualizados

### ✅ **Design Responsivo**
- Breakpoints customizados
- Gradientes adaptativos
- Layout otimizado para todas as telas

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Executa frontend e backend
npm run dev:frontend        # Apenas frontend
npm run dev:backend         # Apenas backend

# Build
npm run build              # Build de produção
npm run preview            # Preview do build

# Personalização de conteúdo
node backend/scripts/personalize-match-final.js
node backend/scripts/personalize-drag-drop-final.js
node backend/scripts/personalize-budget-final.js
node backend/scripts/personalize-goals-final.js
node backend/scripts/personalize-quiz-by-series.js
```

## 📈 Status do Projeto

- ✅ **Frontend**: 100% implementado
- ✅ **Backend**: 100% implementado
- ✅ **Banco de Dados**: 100% configurado
- ✅ **Conteúdo**: 100% personalizado
- ✅ **Responsividade**: 100% otimizada
- ✅ **Gamificação**: 100% funcional

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Desenvolvedor

**Vinicius** - [@ViniYuFin](https://github.com/ViniYuFin)

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do GitHub Issues.

---

**🎓 YüFin - Transformando educação financeira em uma experiência divertida e interativa!**


