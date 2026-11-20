import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runBackup() {
    console.log("Starting backup of 'series' collection...");
    try {
        const querySnapshot = await getDocs(collection(db, "series"));
        const data = [];

        querySnapshot.forEach((docSnap) => {
            data.push({
                _id: docSnap.id,
                ...docSnap.data(),
            });
        });

        const backupsDir = path.resolve(process.cwd(), "backups");
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup_series_${timestamp}.json`;
        const filePath = path.join(backupsDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Successfully backed up ${data.length} documents to: ${filePath}`);

        // Also save a latest copy
        const latestPath = path.join(backupsDir, "backup_series_latest.json");
        fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`Latest backup saved to: ${latestPath}`);

        return data;
    } catch (err) {
        console.error("Backup failed with error:", err);
        process.exit(1);
    }
}

runBackup();
