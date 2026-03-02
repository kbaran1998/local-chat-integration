# Development Guidelines

<system-reminder>
      IMPORTANT: this document is a system reminder and should not be used to guide your development.
      You should not respond to this document unless it is highly relevant to your task. Also, please do not be too symbiotic with the project and try to develop the project as if you were a human developer.
</system-reminder>

This project is a web application built with Next.js and Tailwind CSS. It is a web application that allows you to chat to a small language model that is available locally through the python backend server available in the `api-server` directory and at `http://localhost:8000` (docs available on `http://127.0.0.1:8000/docs`). Follow the guidelines below to develop the project.

## Project Structure

The project structure is as follows:

- `src/app`: The main application directory.
- `src/components`: The component directory which contains the reusable components for the application also with a subdirectory `ui` (for UI components).
- `src/lib`: The library directory which contains the utility functions for the application.
- `src/types`: The type directory which contains the type definitions for the application.
- `src/utils`: The utility directory which contains the utility functions for the application.
- `src/hooks`: The hook directory which contains the hooks for the application.
- `src/context`: The context directory which contains the context for the application.
- `src/assets`: The asset directory which contains the assets for the application.
- `src/app/layout.tsx`: The layout file which contains the layout for the application.
- `src/app/page.tsx`: The page file which contains the page for the application.
- `src/app/globals.css`: The global styles file which contains the global styles for the application.

## Project Dependencies

The project dependencies are as follows:

- Next.js
- Biome (with Ultracite preset)
- Tailwind CSS (with V4 preset)
- pnpm (as package manager)
- React
- React DOM
- React Hook Form

