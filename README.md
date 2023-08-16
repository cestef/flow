# Flow

**Collaborate with your friends and get started on projects right away !**

Flow is a web application that allows you to create and share canvases consisting of nodes and groups that can be connected to each other. It is built with [Next.js](https://nextjs.org/), [tRPC](https://trpc.io/), [Prisma](https://prisma.dev), [next-auth](https://next-auth.js.org/) and [react-flow](https://reactflow.dev/)
## Running

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18.0.0 or higher)
- [pnpm](https://pnpm.io/) (v9.0.0 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/cestef/flow.git
cd flow
```

2. Install dependencies
```bash
pnpm install
```

3. Register a new OAuth app on [GitHub](https://github.com/settings/applications/new) and set the callback URL to `http://localhost:3000/api/auth/callback/`

4. Create a `.env.local` file in the root directory and add the following
```bash
DATABASE_URL="postgresql://postgres:@localhost:5432/flow-dev?schema=public"
NEXTAUTH_SECRET="ultra-secure-secret"
APP_URL="http://localhost:3000"
WS_URL="ws://localhost:3001"
NEXTAUTH_URL="http://localhost:3000/api/auth"
GITHUB_ID="github-oauth-client-id"
GITHUB_SECRET="github-oauth-client-secret"
```

5. Start the development server
```bash
pnpm dev
```

You can now access the app at [localhost:3000](http://localhost:3000)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
