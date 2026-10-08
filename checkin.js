// ==========================================
// WSERS SAFETY CHECK-IN
// ==========================================

const CHECKIN_STORAGE_KEY = "wsersSafetyCheckIn";

let selectedMinutes = 30;
let timerInterval = null;


// ------------------------------------------
// PAGE ELEMENTS
// ------------------------------------------

const startScreen = document.getElementById("startScreen");
const activeScreen = document.getElementById("activeScreen");
const expiredScreen = document.getElementById("expiredScreen");
const completedScreen = document.getElementById("completedScreen");

const timerElement = document.getElementById("timer");
const statusMessage = document.getElementById("statusMessage");
const alertResult = document.getElementById("alertResult");

const startButton = document.getElementById("startCheckinButton");
const safeButton = document.getElementById("safeButton");
const cancelButton = document.getElementById("cancelButton");


// ------------------------------------------
// AUTHENTICATION CHECK
// ------------------------------------------

function checkAuthentication() {

    const idToken = localStorage.getItem("idToken");

    if (!idToken) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}


// ------------------------------------------
// DURATION SELECTION
// ------------------------------------------

document.querySelectorAll(".duration-option").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".duration-option")
            .forEach(item => item.classList.remove("selected"));

        button.classList.add("selected");

        selectedMinutes = parseInt(
            button.dataset.minutes,
            10
        );
    });

});


// ------------------------------------------
// START CHECK-IN
// ------------------------------------------

startButton.addEventListener("click", () => {

    if (!checkAuthentication()) {
        return;
    }

    const endTime =
        Date.now() + (selectedMinutes * 60 * 1000);

    const checkInData = {
        startedAt: Date.now(),
        endTime: endTime,
        durationMinutes: selectedMinutes,
        status: "ACTIVE"
    };

    localStorage.setItem(
        CHECKIN_STORAGE_KEY,
        JSON.stringify(checkInData)
    );

    showActiveScreen();

    startTimer();

});


// ------------------------------------------
// SHOW ACTIVE SCREEN
// ------------------------------------------

function showActiveScreen() {

    startScreen.classList.add("hidden");
    expiredScreen.classList.add("hidden");
    completedScreen.classList.add("hidden");

    activeScreen.classList.remove("hidden");

}


// ------------------------------------------
// TIMER
// ------------------------------------------

function startTimer() {

    clearInterval(timerInterval);

    updateTimer();

    timerInterval = setInterval(() => {

        updateTimer();

    }, 1000);

}


// ------------------------------------------
// UPDATE TIMER
// ------------------------------------------

function updateTimer() {

    const savedData = localStorage.getItem(
        CHECKIN_STORAGE_KEY
    );

    if (!savedData) {

        clearInterval(timerInterval);
        return;
    }

    const checkInData = JSON.parse(savedData);

    const remaining =
        checkInData.endTime - Date.now();


    if (remaining <= 0) {

        clearInterval(timerInterval);

        handleCheckInExpired();

        return;
    }


    const totalSeconds =
        Math.floor(remaining / 1000);

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;


    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


// ------------------------------------------
// USER CONFIRMS SAFE
// ------------------------------------------

safeButton.addEventListener("click", () => {

    clearInterval(timerInterval);

    localStorage.removeItem(
        CHECKIN_STORAGE_KEY
    );

    activeScreen.classList.add("hidden");
    completedScreen.classList.remove("hidden");

});


// ------------------------------------------
// USER CANCELS CHECK-IN
// ------------------------------------------

cancelButton.addEventListener("click", () => {

    const confirmed = confirm(
        "Are you sure you want to cancel this safety check-in?"
    );

    if (!confirmed) {
        return;
    }

    clearInterval(timerInterval);

    localStorage.removeItem(
        CHECKIN_STORAGE_KEY
    );

    activeScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");

});


// ------------------------------------------
// CHECK-IN EXPIRED
// ------------------------------------------

async function handleCheckInExpired() {

    localStorage.removeItem(
        CHECKIN_STORAGE_KEY
    );

    activeScreen.classList.add("hidden");
    expiredScreen.classList.remove("hidden");

    alertResult.textContent =
        "Your check-in expired. Creating an emergency alert...";


    let latitude = null;
    let longitude = null;


    // Try to capture current location
    try {

        const position =
            await getCurrentLocation();

        latitude =
            position.coords.latitude;

        longitude =
            position.coords.longitude;

    } catch (error) {

        console.log(
            "Location unavailable:",
            error.message
        );

    }


    await createEmergencyAlert(
        latitude,
        longitude
    );

}


// ------------------------------------------
// GET CURRENT LOCATION
// ------------------------------------------

function getCurrentLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                new Error("Geolocation is not supported.")
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

    });

}


// ------------------------------------------
// CREATE EMERGENCY ALERT
// ------------------------------------------

async function createEmergencyAlert(
    latitude,
    longitude
) {

    try {

        const response = await fetch(
            `${AWS_CONFIG.apiUrl}/emergency-alert`,
            {
                method: "POST",

                headers: getAuthHeaders(),

                body: JSON.stringify({

                    alertType: "SAFETY_CHECK_IN_MISSED",

                    latitude: latitude,

                    longitude: longitude,

                    message:
                        "Safety check-in expired without confirmation."

                })
            }
        );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to create emergency alert."
            );

        }


        alertResult.innerHTML = `
            <strong>Emergency alert created.</strong>
            <br><br>
            Alert ID:
            ${result.alert?.alertId || "Created"}
            <br><br>
            Your alert has been recorded in WSERS.
            `;


        const button =
            document.createElement("button");

        button.className = "safe-button";

        button.textContent =
            "View Alert History";

        button.onclick = () => {

            window.location.href =
                "alerts.html";

        };


        alertResult.appendChild(button);


    } catch (error) {

        console.error(
            "Safety check-in alert error:",
            error
        );


        alertResult.innerHTML = `
            <strong>Unable to create the emergency alert.</strong>
            <br><br>
            ${error.message}
            <br><br>
            Please contact emergency services directly
            if you are in immediate danger.
        `;

    }

}


// ------------------------------------------
// RESTORE ACTIVE CHECK-IN
// ------------------------------------------

function restoreCheckIn() {

    const savedData =
        localStorage.getItem(
            CHECKIN_STORAGE_KEY
        );


    if (!savedData) {
        return;
    }


    try {

        const checkInData =
            JSON.parse(savedData);


        if (
            !checkInData.endTime ||
            checkInData.endTime <= Date.now()
        ) {

            handleCheckInExpired();

            return;
        }


        showActiveScreen();

        startTimer();


    } catch (error) {

        console.error(
            "Unable to restore check-in:",
            error
        );

        localStorage.removeItem(
            CHECKIN_STORAGE_KEY
        );

    }

}


// ------------------------------------------
// INITIALISE
// ------------------------------------------

if (checkAuthentication()) {

    restoreCheckIn();

}