# Design Studio: Professional Furniture Planning System

**Module:** PUSL3122 – HCI, Computer Graphics, and Visualisation  
[cite_start]**Institution:** NSBM Green University (in partnership with University of Plymouth) [cite: 1-2]  
**Group Number:** 202  


---

## 1. Project Overview
**Design Studio** is a professional-grade interior design application developed for a bespoke furniture company. [cite_start]It bridges the gap between 2D technical planning and immersive 3D visualization, allowing in-store designers to collaborate with customers on custom room layouts and furniture configurations [cite: 172-174]. [cite_start]The application solves the spatial uncertainty customers face by providing a realistic digital preview of furniture within their specific room dimensions[cite: 172].

### Core Features (Module Requirements)
* **Admin Access:** Secure role-based login and a "Design Dashboard" for managing (CRUD) saved projects [cite: 175-176, 183-184].
* **2D Floor Planner:** Interactive drawing tool for custom room shapes, including L-shaped and open-plan layouts [cite: 177-178].
* **3D Rendering Engine:** Real-time extrusion of 2D plans into a 3D environment using **Three.js**[cite: 175, 179].
* **Furniture Interaction:** Ability to add, scale, rotate, and move furniture items like chairs and tables[cite: 180].
* **Aesthetic Customization:** Change colors and add realistic shading to simulate specific color schemes [cite: 181-182].
* **Proposal Export:** Integrated PDF export for design quotes using the `jspdf` library.

---

## 2. Technical Architecture
The system utilizes a decoupled **MERN Stack** architecture to ensure high performance and modular development:

* **Frontend:** React 19, Vite, Three.js (React Three Fiber), Tailwind CSS.
* **Backend:** Node.js, Express.js.
* **Data Persistence:** MongoDB Atlas (Cloud Database).

---

## 3. Getting Started (Installation)

Follow these steps to set up and run the application on your machine (Optimized for **MacBook M2**):

### Prerequisites
* [Node.js (LTS)](https://nodejs.org/) installed.
* A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and a cluster created.

### Setup Instructions
1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Binuda-Jayawardhana/PUSL3122_-Group_202-.git](https://github.com/Binuda-Jayawardhana/PUSL3122_-Group_202-.git)
    cd Design_Studio
    ```

2.  **Configure the Backend:**
    ```bash
    cd backend
    npm install
    ```
    * Create a file named **`.env`** in the `backend` folder:
        ```bash
        touch .env
        ```
    * Open `.env` and add your MongoDB Atlas connection string:
        ```text
        PORT=5000
        MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/design_studio?retryWrites=true&w=majority
        ```
    * Start the backend server:
        ```bash
        npm start
        ```

3.  **Initialize the Frontend:**
    ```bash
    cd ../design-studio
    npm install
    npm run dev
    ```
    * The application will be accessible at `http://localhost:5173`.

---

## 4. Demo Credentials
For testing purposes, use the following credentials to access the Designer Dashboard:

* **Admin Account:** `admin@designstudio.com` / `admin123`
* **Standard User:** `john@example.com` / `user123`

---

## 5. Credits & External Resources
As per the coursework requirements, we acknowledge the use of the following resources:
* **Icons:** [Lucide React](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/).
* **3D Helpers:** [@react-three/drei](https://github.com/pmndrs/drei) for environment and lighting.
* **Documentation:** [Three.js Documentation](https://threejs.org/) and [MDN Web Docs](https://developer.mozilla.org/) for the 2D Canvas API.
* **References:** Market research based on industry leaders like [IKEA Kreativ](https://www.ikea.com).

---
