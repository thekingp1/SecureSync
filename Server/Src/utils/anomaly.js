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
        // return await res.json();
        const data = await res.json();
console.log("anomaly result:", data);
return data;
    } catch(e){
        console.error("anomaly servier error:", e.message);
        return null;
    }
}