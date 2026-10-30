# Frontend de Plataforma 5E

Aplicación React, TypeScript y Vite. Se comunica con el backend mediante HTTP.

## Repositorios

- Frontend: https://github.com/Yansete/plataforma-5e-frontend
- Backend y documentación general: https://github.com/Yansete/plataforma-5e-taller-integrador

El frontend se extrajo de la carpeta frontend del repositorio original mediante git subtree split, conservando su historial.

## Desarrollo local

Requisito: Node.js 22.

```bash
npm ci
npm run dev
```

La aplicación abre en http://localhost:5173.

Con VITE_API_URL vacío, Vite reenvía /api al backend local en http://127.0.0.1:8000.
BACKEND_URL permite cambiar el destino del proxy.
Consulta .env.example para la configuración del cliente.

## Verificación

```bash
npm run typecheck
npm test
npm run test:coverage
npm run build
```

La cobertura exige 80 % en líneas, sentencias y funciones, y 70 % en ramas de los archivos configurados.

## Pruebas E2E

Playwright inicia el backend con una base SQLite temporal y el frontend de prueba.
Usa el generador por reglas y desactiva la búsqueda externa.

Se necesita Python con las dependencias del backend instaladas.
Por defecto busca el backend en ../plataforma-5e-taller-integrador/backend.
BACKEND_DIR permite indicar otra carpeta y PYTHON permite seleccionar el intérprete.

Ejemplo en PowerShell, con ambos repositorios como carpetas vecinas:

```powershell
$env:PYTHON = (Resolve-Path "../plataforma-5e-taller-integrador/backend/.venv/Scripts/python.exe").Path
npx playwright install chromium
npm run test:e2e
```

## Integración continua

GitHub Actions ejecuta tipos, pruebas con cobertura, compilación y E2E.
Para E2E descarga main del repositorio del backend y registra el commit utilizado.
Los reportes quedan disponibles como artefactos de la ejecución.

## Vercel

- Repositorio: Yansete/plataforma-5e-frontend.
- Rama de producción: main.
- Root Directory: raíz del repositorio, sin frontend/.
- Framework: Vite.
- Instalación: npm ci.
- Compilación: npm run build.
- Directorio de salida: dist.
- VITE_API_URL: https://plataforma5e-api.onrender.com, sin barra final.

vercel.json conserva las rutas de la SPA.
La conexión de Vercel la realiza Juan, quien tiene acceso al proyecto.
La migración se considera completada después de comprobar el despliegue publicado.
