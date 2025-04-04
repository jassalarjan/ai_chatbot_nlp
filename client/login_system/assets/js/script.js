document.getElementById("loginForm").addEventListener("submit", function (e) {
	e.preventDefault();
	let formData = new FormData(this);

	fetch("login.php", {
		method: "POST",
		body: formData,
	})
		.then((res) => res.text())
		.then((data) => {
			console.log("Login Response:", data); // Debugging
			if (data.trim() === "success") {
				document.getElementById("loginMessage").textContent =
					"Login Successful! Redirecting...";
				setTimeout(() => (window.location.href = "dashboard.php"), 2000);
			} else {
				document.getElementById("loginMessage").textContent =
					"Invalid credentials!";
			}
		})
		.catch((err) => console.error("Login Fetch Error:", err));
});

document
	.getElementById("registerForm")
	.addEventListener("submit", function (e) {
		e.preventDefault();
		let formData = new FormData(this);

		fetch("register.php", {
			method: "POST",
			body: formData,
		})
			.then((res) => res.text())
			.then((data) => {
				console.log("Register Response:", data); // Debugging
				if (data.trim() === "success") {
					document.getElementById("registerMessage").textContent =
						"Registered Successfully! Redirecting...";
					setTimeout(() => (window.location.href = "index.php"), 2000);
				} else {
					document.getElementById("registerMessage").textContent =
						"Error! Try again.";
				}
			})
			.catch((err) => console.error("Register Fetch Error:", err));
	});

const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
	container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
	container.classList.remove("sign-up-mode");
});
