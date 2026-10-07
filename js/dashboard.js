const API_URL =
    AWS_CONFIG.apiUrl + "/emergency-alert";


/* =========================
   DISPLAY USER EMAIL
========================= */

const userEmailElement =
    document.getElementById("userEmail");

const storedEmail =
    localStorage.getItem("userEmail");

if (userEmailElement) {

    userEmailElement.textContent =
        storedEmail || "User";

}


/* =========================
   LOGOUT
========================= */

const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem("idToken");

            localStorage.removeItem("accessToken");

            localStorage.removeItem("userEmail");

            window.location.href =
                "index.html";

        }
    );

}


/* =========================
   SOS BUTTON
========================= */

const sosButton =
    document.getElementById("sosButton");

const locationStatus =
    document.getElementById("locationStatus");

const locationDetails =
    document.getElementById("locationDetails");


if (sosButton) {

    sosButton.addEventListener(
        "click",
        function () {

            activateSOS();

        }
    );

}


/* =========================
   ACTIVATE SOS
========================= */

function activateSOS() {

    const confirmed =
        confirm(
            "Are you sure you want to activate an emergency SOS alert?"
        );


    if (!confirmed) {

        return;

    }


    sosButton.disabled = true;

    sosButton.textContent =
        "Getting Location...";


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "Geolocation is not supported by this browser.";

        sendEmergencyAlert(
            null,
            null
        );

        return;

    }


    locationStatus.textContent =
        "Requesting location permission...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            locationStatus.textContent =
                "Location captured successfully";


            locationDetails.innerHTML = `
                <span>Latitude: ${latitude}</span>
                <span>Longitude: ${longitude}</span>
            `;


            sendEmergencyAlert(
                latitude,
                longitude
            );

        },


        function (error) {

            console.warn(
                "Location error:",
                error
            );


            locationStatus.textContent =
                "Location unavailable. Sending alert without location.";

            locationDetails.innerHTML = `
                <span>Latitude: —</span>
                <span>Longitude: —</span>
            `;


            sendEmergencyAlert(
                null,
                null
            );

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}


/* =========================
   SEND ALERT TO API
========================= */

async function sendEmergencyAlert(
    latitude,
    longitude
) {

    sosButton.textContent =
        "Sending SOS...";


    const userId =
        localStorage.getItem("userEmail")
        || "WEB-USER";


    const alertData = {

        userId: userId,

        alertType: "SOS",

        latitude: latitude,

        longitude: longitude,

        message: "Emergency SOS alert"

    };


    try {

        /*
         * Send the Cognito ID token with the request.
         * The API Gateway Cognito authorizer will use
         * this token once we attach the authorizer.
         */

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify(alertData)

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


        console.log(
            "SOS response:",
            result
        );


        sosButton.textContent =
            "✓ SOS ACTIVATED";


        locationStatus.textContent =
            "Emergency alert created successfully";


        alert(
            "Emergency SOS alert created successfully."
        );


    } catch (error) {

        console.error(
            "SOS error:",
            error
        );


        sosButton.textContent =
            "ACTIVATE SOS";


        alert(
            "Unable to create the SOS alert. Please try again."
        );

    }


    setTimeout(
        function () {

            sosButton.disabled = false;

            sosButton.textContent =
                "🚨 ACTIVATE SOS";

        },

        3000
    );

}