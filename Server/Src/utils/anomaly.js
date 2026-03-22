export async function analyzeEvent({userId, action}){
    try {
        const res = await fetch("http://localhost:5001/analyze", {
            method: "POST",
            headers: {"content-Type": "application/json"},
            body: JSON.stringify({
                userId: String(userId),
                action,
                timestamp: new Date().toISOString(),
            }),
        });
        return await res.json();
    } catch(e){
        console.error("anomaly servier error:", e.message);
        return null;
    }
}