const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: AWS_CONFIG.userPoolId,
    ClientId: AWS_CONFIG.clientId
});


/* =========================
   LOGIN
========================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const authenticationData = {
            Username: email,
            Password: password
        };

        const authenticationDetails =
            new AmazonCognitoIdentity.AuthenticationDetails(
                authenticationData
            );

        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser =
            new AmazonCognitoIdentity.CognitoUser(userData);


        cognitoUser.authenticateUser(authenticationDetails, {

            onSuccess: function (session) {

                console.log("Login successful.");

                localStorage.setItem(
                    "idToken",
                    session.getIdToken().getJwtToken()
                );

                localStorage.setItem(
                    "accessToken",
                    session.getAccessToken().getJwtToken()
                );

                localStorage.setItem(
                    "userEmail",
                    email
                );

                window.location.href = "dashboard.html";
            },


            onFailure: function (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Login failed. Please check your email and password."
                );
            }

        });

    });
}


/* =========================
   REGISTRATION
========================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (!email || !password || !confirmPassword) {

            alert("Please complete all fields.");

            return;
        }


        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;
        }


        if (password.length < 8) {

            alert("Password must contain at least 8 characters.");

            return;
        }


        const attributeList = [];


        const emailAttribute =
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: "email",
                Value: email
            });


        attributeList.push(emailAttribute);


        const registerButton =
            registerForm.querySelector("button[type='submit']");

        registerButton.disabled = true;

        registerButton.textContent = "Creating Account...";


        userPool.signUp(
            email,
            password,
            attributeList,
            null,

            function (error, result) {

                if (error) {

                    console.error(error);

                    alert(
                        error.message ||
                        "Registration failed."
                    );

                    registerButton.disabled = false;

                    registerButton.textContent =
                        "Create Account";

                    return;
                }


                console.log(
                    "Registration successful:",
                    result
                );


                localStorage.setItem(
                    "pendingVerificationEmail",
                    email
                );


                window.location.href =
                    "verify.html";
            }
        );

    });
}