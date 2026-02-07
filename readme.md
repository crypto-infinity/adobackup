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
3. Crea un file `.env` con queste variabili **obbligatorie**:
   ```env
   # Azure DevOps
   AZURE_DEVOPS_PAT=<il-tuo-pat>
   AZURE_DEVOPS_USERNAME=pat # (opzionale, default: pat)

   # Azure Blob Storage
   AZURE_STORAGE_KEY=<chiave-blob-storage>
   AZURE_STORAGE_ACCOUNT=<nome-account-storage>
   AZURE_STORAGE_CONTAINER=<nome-container>

   # API JWT (Azure Entra ID)
   AZURE_TENANT_ID=<tenant-id>
   AZURE_API_AUDIENCE=<application-id-uri>

   # Generale
   PORT=3000
   ```
4. Avvia l'app:
   ```sh
   npm start
   ```

## Deploy su Azure App Service
1. Crea un App Service Linux (Node.js 18+).
2. Carica tutti i file del progetto, inclusi `startup.sh` e `run_startup.sh`.
3. Vai su **Configurazione** → **Variabili di applicazione** e aggiungi **tutte** le variabili sopra elencate.
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


## Ottenimento token JWT (Bearer)
Per autenticare le chiamate all'API `/backup` è necessario un token JWT ottenuto tramite Azure Entra ID (ex Azure AD) con grant **client_credentials**.

### 1. Prerequisiti
- **App registration** su Azure Entra ID (ex Azure AD)
- Permessi API: la tua app deve avere accesso all'audience configurata (`AZURE_API_AUDIENCE`)

### 2. Richiesta token
Esegui una richiesta HTTP:
```
POST https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id=<CLIENT_ID>&scope=<API_AUDIENCE>/.default&client_secret=<CLIENT_SECRET>&grant_type=client_credentials
```

Dove:
- `<TENANT_ID>` = valore di `AZURE_TENANT_ID`
- `<CLIENT_ID>` = Application (client) ID della tua app registration
- `<CLIENT_SECRET>` = secret generato per la tua app registration
- `<API_AUDIENCE>` = Application ID URI della tua API (es: `api://<client-id>` oppure quello configurato in `AZURE_API_AUDIENCE`)

### 3. Esempio di risposta
```
{
   "token_type": "Bearer",
   "expires_in": 3599,
   "ext_expires_in": 3599,
   "access_token": "<TOKEN>"
}
```

Il campo `access_token` va usato come Bearer token nell'header Authorization delle chiamate API.

## Note
- L'app richiede che git sia installato: lo script di startup lo installa ad ogni avvio.
- Puoi integrare questa API con Azure Logic Apps per backup schedulati di più repository.

## Swagger
La documentazione OpenAPI è disponibile su:
```
https://<tuo-app-service>.azurewebsites.net/api-docs
```
