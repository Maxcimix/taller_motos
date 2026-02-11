# Taller de Motos - PRUEBA TECNICA

## Estructura del Proyecto

```
taller-motos-pavas/
├── backend/                    # API REST (Node.js + Express + Sequelize)
│   ├── config/
│   │   └── database.js         # Configuracion de conexion a MySQL
│   ├── controllers/
│   │   ├── clientController.js
│   │   ├── bikeController.js
│   │   └── workOrderController.js
│   ├── database/
│   │   └── init.sql            # Script SQL para crear la base de datos
│   ├── middleware/
│   │   └── errorHandler.js     # Middleware global de errores
│   ├── models/
│   │   ├── Client.js
│   │   ├── Bike.js
│   │   ├── WorkOrder.js
│   │   ├── OrderItem.js
│   │   └── index.js            # Relaciones entre modelos
│   ├── routes/
│   │   ├── clients.js
│   │   ├── bikes.js
│   │   └── workOrders.js
│   ├── .env                    # Variables de entorno (no se sube a Git)
│   ├── .env.example            # Plantilla de variables de entorno
│   ├── package.json
│   └── server.js               # Punto de entrada del servidor
│
├── frontend/                   # Aplicacion React (Create React App)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoadingSpinner.js / .css
│   │   │   ├── Modal.js / .css
│   │   │   ├── Navbar.js / .css
│   │   │   ├── Pagination.js / .css
│   │   │   └── StatusBadge.js / .css
│   │   ├── pages/
│   │   │   ├── WorkOrderList.js / .css
│   │   │   ├── WorkOrderCreate.js / .css
│   │   │   └── WorkOrderDetail.js / .css
│   │   ├── services/
│   │   │   └── api.js          # Configuracion de Axios y servicios
│   │   ├── App.js / App.css
│   │   ├── index.js / index.css
│   │   └── ...
│   └── package.json
│
├── package.json                # Scripts raiz para conveniencia
├── .gitignore
└── README.md
```

## Paso 1: Configurar XAMPP y MySQL

### 1.1 Iniciar los servicios de XAMPP

1. Abra el **Panel de Control de XAMPP**.
2. Haga clic en **Start** en el modulo **Apache** (necesario para phpMyAdmin).
3. Haga clic en **Start** en el modulo **MySQL**.
4. Ambos servicios deben mostrar el estado en **verde**.


### 1.2 Crear la base de datos


#### Desde phpMyAdmin (interfaz grafica)

1. Abra su navegador y vaya a: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Haga clic en **"Nueva"** (o **"New"**) en el panel izquierdo.
3. En el campo **"Nombre de la base de datos"**, escriba: `taller_motos`
4. En **"Cotejamiento"**, seleccione: `utf8mb4_unicode_ci`
5. Haga clic en **"Crear"**.


## Paso 2: Configurar las Variables de Entorno

### 2.1 Backend

Navegue a la carpeta `backend/` y verifique que el archivo `.env` exista con el siguiente contenido:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=taller_motos
DB_USER=root
DB_PASSWORD=
```


## Paso 3: Instalar Dependencias


### Instalar por separado

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd frontend
npm install
```

---

## Paso 4: Ejecutar el Proyecto

Necesita **dos terminales** abiertas al mismo tiempo.

### Terminal 1 - Backend (API REST)

```bash
cd backend
npm run dev
```

Deberia ver en consola:

```
Conexion a MySQL establecida correctamente.
Modelos sincronizados con la base de datos.
Servidor corriendo en http://localhost:3001
```

> Si ve un error de conexion, verifique que XAMPP tenga MySQL corriendo y que los datos del archivo `.env` sean correctos.

### Terminal 2 - Frontend (React)

```bash
cd frontend
npm start
```

Se abrira automaticamente su navegador en: [http://localhost:3000](http://localhost:3000)

> El frontend esta configurado con un proxy hacia `http://localhost:3001`, por lo que las peticiones a la API se redirigen automaticamente durante el desarrollo.

---

## Endpoints de la API

### Clientes

| Metodo | Endpoint               | Descripcion                     |
|--------|------------------------|---------------------------------|
| POST   | `/api/clients`         | Crear un cliente                |
| GET    | `/api/clients?search=` | Listar clientes (busqueda)      |
| GET    | `/api/clients/:id`     | Obtener cliente por ID          |

### Motos

| Metodo | Endpoint              | Descripcion                     |
|--------|-----------------------|---------------------------------|
| POST   | `/api/bikes`          | Registrar una moto              |
| GET    | `/api/bikes?plate=`   | Listar motos (filtro por placa) |
| GET    | `/api/bikes/:id`      | Obtener moto por ID             |

### Ordenes de Trabajo

| Metodo | Endpoint                             | Descripcion                      |
|--------|--------------------------------------|----------------------------------|
| POST   | `/api/work-orders`                   | Crear orden de trabajo           |
| GET    | `/api/work-orders?status=&plate=&page=&pageSize=` | Listar ordenes (filtros y paginacion) |
| GET    | `/api/work-orders/:id`               | Obtener orden por ID (con items) |
| PATCH  | `/api/work-orders/:id/status`        | Cambiar estado de la orden       |
| POST   | `/api/work-orders/:id/items`         | Agregar item a la orden          |
| DELETE | `/api/work-orders/items/:itemId`     | Eliminar item de la orden        |

---


## Modelo de Datos

```
+----------+       +---------+       +-------------+       +-------------+
| clients  |1----N | bikes   |1----N | work_orders |1----N | order_items |
+----------+       +---------+       +-------------+       +-------------+
| id       |       | id      |       | id          |       | id          |
| name     |       | placa   |       | moto_id(FK) |       | work_order_id(FK)|
| phone    |       | brand   |       | entry_date  |       | type        |
| email    |       | model   |       | fault_desc  |       | description |
+----------+       | cylinder|       | status      |       | count       |
                   | client_id(FK)|  | total       |       | unit_value  |
                   +---------+       +-------------+       +-------------+
```

