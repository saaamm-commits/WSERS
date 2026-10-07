const AWS_CONFIG = {
    region: "us-east-1",
    userPoolId: "us-east-1_SVC2a3uPw",
    clientId: "5b9gjrjtksa1c962fv18kgsstj",
    redirectUri: "http://localhost:3000/",
    apiUrl: "https://yiejcsx6dj.execute-api.us-east-1.amazonaws.com/prod"
};


// Get authentication headers for AWS API requests
function getAuthHeaders() {

    const idToken = localStorage.getItem("idToken");

    if (!idToken) {
        return {
            "Content-Type": "application/json"
        };
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
    };
}