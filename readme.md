# adobackup

Backup automatico di repository Git su Azure Blob Storage tramite API REST.

## Requisiti
- Node.js 18+
- Azure App Service (Linux)
- Azure Blob Storage
- Azure DevOps Personal Access Token (PAT)

## Setup locale
1. Clona il repository:
   ```sh
   git clone <questo-repo>
   cd adobackup
   ```
2. Installa le dipendenze:
   ```sh
   npm install
   ```
3. Crea un file `.env` con queste variabili:
   ```env
   AZURE_DEVOPS_PAT=<il-tuo-pat>
   AZURE_STORAGE_KEY=<chiave-blob-storage>
   AZURE_STORAGE_ACCOUNT=<nome-account-storage>
   AZURE_STORAGE_CONTAINER=<nome-container>
   PORT=3000
   ```
4. Avvia l'app:
   ```sh
   npm start
   ```

## Deploy su Azure App Service
1. Crea un App Service Linux (Node.js 18+).
2. Carica tutti i file del progetto, inclusi `startup.sh` e `run_startup.sh`.
3. Vai su **Configurazione** → **Variabili di applicazione** e aggiungi:
   - `AZURE_DEVOPS_PAT` = il tuo PAT
   - `AZURE_STORAGE_KEY` = chiave blob storage
   - `AZURE_STORAGE_ACCOUNT` = nome account storage
   - `AZURE_STORAGE_CONTAINER` = nome container
4. (Opzionale) Modifica il file `startup.sh` per log e debug.
5. Vai su **Configurazione** -> **Impostazioni Stack** e aggiungi allo startup script: `/home/site/wwwroot/startup.sh`
6. Riavvia l'App Service.

## Verifica installazione git
- Controlla i log di avvio (Log stream) per la presenza della versione di git.
- In alternativa, accedi via SSH/Kudu e lancia `git --version`.

## Esempio di chiamata API
### POST /backup
Effettua il backup di una repository Git su Azure Blob Storage.

**Request:**
```
POST https://<tuo-app-service>.azurewebsites.net/backup
Content-Type: application/json

{
  "repoUrl": "https://dev.azure.com/tuo-org/tuo-progetto/_git/tuo-repo"
}
```

**Response:**
```
{
  "success": true,
  "blobName": "20260206T123456/repo-backup.zip"
}
```

Se `repoUrl` o altri parametri non sono specificati, viene restituito HTTP 400.

## Note
- L'app richiede che git sia installato: lo script di startup lo installa ad ogni avvio.
- Puoi integrare questa API con Azure Logic Apps per backup schedulati di più repository.

## Swagger
La documentazione OpenAPI è disponibile su:
```
https://<tuo-app-service>.azurewebsites.net/api-docs
```
