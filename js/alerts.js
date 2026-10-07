document.addEventListener("DOMContentLoaded", () => {

    const userEmail =
        localStorage.getItem("userEmail");


    if (!userEmail) {

        window.location.href =
            "index.html";

        return;
    }


    const alertsContainer =
        document.getElementById(
            "alertsContainer"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const loadingState =
        document.getElementById(
            "loadingState"
        );


    async function loadAlerts() {

        try {

            loadingState.style.display =
                "block";

            emptyState.style.display =
                "none";


            const response =
                await fetch(
                    `${AWS_CONFIG.apiUrl}/emergency-alerts?userId=${encodeURIComponent(userEmail)}`,
                    {
                        method: "GET",

                        headers:
                            getAuthHeaders()
                    }
                );


            const data =
                await response.json();


            loadingState.style.display =
                "none";


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Failed to load alert history."
                );

            }


            const alerts =
                data.alerts || [];


            alertsContainer.innerHTML =
                "";


            if (alerts.length === 0) {

                emptyState.style.display =
                    "block";

                return;
            }


            alerts.forEach(
                alert => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "alert-card";


                    const date =
                        alert.createdAt
                            ? new Date(
                                alert.createdAt
                            ).toLocaleString(
                                "en-GB"
                            )
                            : "Unknown";


                    const location =
                        alert.latitude !== null &&
                        alert.longitude !== null

                            ? `${alert.latitude}, ${alert.longitude}`

                            : "Location not available";


                    card.innerHTML = `

                        <div class="alert-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        alert.alertType ||
                                        "SOS Alert"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(date)}
                                </p>

                            </div>


                            <span class="alert-status">

                                ${escapeHTML(
                                    alert.status ||
                                    "ACTIVE"
                                )}

                            </span>

                        </div>


                        <div class="alert-details">


                            <div class="alert-detail">

                                <strong>
                                    Location
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        location
                                    )}
                                </span>

                            </div>


                            <div class="alert-detail">

                                <strong>
                                    Message
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        alert.message ||
                                        "Emergency SOS alert"
                                    )}
                                </span>

                            </div>


                            <div class="alert-detail">

                                <strong>
                                    Alert ID
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        alert.alertId ||
                                        "N/A"
                                    )}
                                </span>

                            </div>


                        </div>

                    `;


                    alertsContainer.appendChild(
                        card
                    );

                }
            );


        } catch (error) {

            console.error(
                "Error loading alerts:",
                error
            );


            loadingState.style.display =
                "none";


            alertsContainer.innerHTML = `

                <div class="error-message">

                    Unable to load alert history.
                    Please try again.

                </div>

            `;

        }

    }


    function escapeHTML(value) {

        return String(value || "")

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    loadAlerts();

});