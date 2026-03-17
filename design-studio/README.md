# Design Studio: Professional Furniture Planning System
**Module:** PUSL3122 – HCI, Computer Graphics, and Visualisation  
**Institution:** NSBM Green University (in partnership with University of Plymouth)  
**Submission Date:** 19th March 2026

## 1. Project Overview
**Design Studio** is a professional-grade interior design application developed for a bespoke furniture company. It bridges the gap between 2D technical planning and immersive 3D visualization, allowing in-store designers to collaborate with customers on custom room layouts and furniture configurations.

### Core Features (Module Requirements)
* **Admin Access:** Role-based login and a "Design Dashboard" for managing (CRUD) saved projects.
* **2D Floor Planner:** Interactive vertex-based room drawing with grid-snapping for custom room shapes.
* **3D Rendering Engine:** Real-time extrusion of 2D coordinates into 3D walls using Three.js algorithms.
* **Furniture Interaction:** Capability to add, scale, rotate, and customize the color/finish of furniture items.
* **Shading & Lighting:** Implementation of directional and ambient lighting to simulate realistic shading.
* **Exporting:** Integrated PDF export for design quotes using `html2canvas` and `jspdf`.

---

## 2. Technical Architecture
The system utilizes a decoupled Full-Stack architecture to ensure high performance and modular development:

* **Frontend (`/design-studio`):** React 19, Vite, Three.js (React Three Fiber), Tailwind CSS, Zustand.
* **Backend (`/backend`):** Node.js, Express.js, Axios.
* **Data Persistence:** JSON-based project storage with LocalStorage synchronization.

---

## 3. Team Members & Contributions
This project was developed by a team of six members. Each member focused on a specific pillar of the coursework brief:

| Member Name | Role | Primary Contributions |
| :--- | :--- | :--- |
| **[Member 1 Name]** | Project Manager | Scrum/Agile lead, GitHub architecture, Documentation. |
| **[Member 2 Name]** | HCI Specialist | UI/UX Design (Figma), Personas, Usability Testing. |
| **[Member 3 Name]** | Frontend Lead | Admin Dashboard, Login logic, Project Persistence. |
| **[Member 4 Name]** | Graphics Lead | Three.js 3D Engine, Extrusion logic, Shading. |
| **[Member 5 Name]** | Interaction Dev | 2D Canvas drawing tool, Object manipulation. |
| **[Member 6 Name]** | QA Engineer | User Research, Bug tracking, Summative Evaluation. |

---

## 4. Getting Started (Installation)

To run this application on your **MacBook M2**, follow these steps:

### Prerequisites
* [Node.js (LTS)](https://nodejs.org/) installed.
* Homebrew (optional, for package management).

### Setup Instructions
1.  **Clone the Repository:**
    ```bash
    git clone [Your Repository URL]
    cd Design_Studio
    ```

2.  **Initialize Backend:**
    ```bash
    cd backend
    npm install
    npm start
    ```

3.  **Initialize Frontend:**
    ```bash
    cd design-studio
    npm install
    npm run dev
    ```
    *The app will be accessible at `http://localhost:5173`.*

---

## 5. Credits & External Resources
As per the coursework requirements, we acknowledge the use of the following resources:
* **Icons:** [Lucide React](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/).
* **3D Helpers:** [@react-three/drei](https://github.com/pmndrs/drei) for environment and lighting.
* **Documentation:** Three.js and MDN Web Docs for 2D Canvas API.