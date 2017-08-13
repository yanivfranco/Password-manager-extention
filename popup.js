
var port = chrome.extension.connect({
	name: "Sample Communication"
});

port.onMessage.addListener(function(msg) {
	//handling messages return from background
	console.log("message recieved: " + msg.type);
	if(msg.type == "notConnected"){
		$("#register").hide();
		$("#connected").hide();
		$("#login").show();
	}

	if(msg.type == "connected"){
		port.postMessage({type: "checkTagOnLoad"});
		$("#register").hide();
		$("#connected").show();
		$("#login").hide();
		$("#connectMessage").html("You are now connected with user: "+msg.username);
	}

	if(msg.type == "tagNotOk"){
		$("#img").attr("src","alert.png");
		$("body").css("background-color","red");
		$("#connectMessage").html(msg.username+", Your passwords might have been compromised. contact us immediatly.");
	}
});

//checking if user is already connected
port.postMessage({type: "isConnected"});






document.getElementById("message").innerHTML = "Please enter username & password and press connect";
document.getElementById("connectButton").onclick = function() {connect()};
document.getElementById("registerButton").onclick = function() {register()};

$("#registerHereButton").click(function(){
	loginToRegister();
});
$("#back").click(function(){
	registerToLogin();
});
$("#disconnect").click(function(){
	connectedToLogin();
	port.postMessage({type: "disconnected"})
	$("#img").attr("src","icon.png");
	$("body").css("background-color"," #81BEF7");
});



function connect(){
	chrome.cookies.getAll({"url":"http://www.passmanager.com"},callback);
	function callback(cookies){
		var login_attempts = -1, expired_time = -1, is_locked = "";
		console.log((cookies));
		cookies.forEach(function(cookie){
			if(cookie.name == "login_attempts"){
				login_attempts = cookie.value;
				expired_time = cookie.expirationDate;
			}
			if(cookie.name == "is_locked"){
				is_locked = cookie.expirationDate;
			}
		})
		console.log("is locked = "+is_locked);
		console.log("attempts = "+login_attempts);
		console.log("expired_time = "+expired_time);
		if(is_locked != ""){
			var time_left = is_locked - (((new Date()).getTime())/1000);
			document.getElementById("message").innerHTML = "You are locked after 3 unsuccessful login attempts. You can try again in "+time_left+" seconds";
			return;
		}
		var username = document.getElementById("username").value;
		var password = document.getElementById("password").value;

		var hPass0 = sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash(password+'0'));
		var key1 = sjcl.hash.sha256.hash(password+'1');
		var key2 = sjcl.hash.sha256.hash(password+'2');

		/*
			sending the hashed passwords to the server
		 */
		var xhr = new XMLHttpRequest();
		xhr.open('POST', "http://127.0.0.1:8081/", true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		var req = 'type=login&user='+username+'&hPass0='+hPass0;
		xhr.send(req);

		xhr.onreadystatechange = processRequest;

		function processRequest(e) {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var response = xhr.responseText;
				if (response == "noUser"){
					document.getElementById("message").innerHTML = "Username was not found";
				}

				if (response == "noPass"){
					if(login_attempts != -1){ //if the user tried to login already
						login_attempts++;
						if(login_attempts == "3"){// if he tried 3 times
							setCookie("is_locked","true",60);
							chrome.cookies.remove({"url":"http://www.passmanager.com", "name":"login_attempts"});
							document.getElementById("message").innerHTML = "Password is incorrect. You entered wrong password 3 times. Now locked for 1 minute.";
						}
						else{//less than 3 attempts
							setCookie("login_attempts",""+login_attempts,((expired_time-(((new Date()).getTime())/1000))));
							document.getElementById("message").innerHTML = "Password is incorrect. You entered wrong password "+login_attempts+"/3 times.";
						}						
					}
					else{//if this is the first login
						login_attempts = "1";
						setCookie("login_attempts",""+login_attempts,180);
						document.getElementById("message").innerHTML = "Password is incorrect. You entered wrong password "+login_attempts+"/3 times.";
					}

				}
				if (response == "success"){
					document.getElementById("message").innerHTML = (("Login succesful, you will be redirected in 3 second").bold()).fontcolor("green");
					port.postMessage({type: "login", username: username, key1: key1, key2: key2});
					port.postMessage({type: "checkTag"});
					setTimeout(loginToConnected, 3000);
					chrome.cookies.remove({"url":"http://www.passmanager.com", "name":"login_attempts"});
					$("#connectMessage").html("You are now connected with user: "+username);
				}	         		        
			}
		}

	}
}



function register(){
	var username = document.getElementById("username1").value;
	var password = document.getElementById("password1").value;
	var password2 = document.getElementById("password2").value;

	/*
	checks input
	 */

	if(password != password2){
		document.getElementById("message1").innerHTML = "Passwords does not match";
		return;
	}

	if(username == ''){
		document.getElementById("message1").innerHTML = "Please enter a username";
		return;
	}


	if(!checkPassword(password)){
			console.log(password);
			document.getElementById("message1").innerHTML = "Your password must contain atleast: 6 chracters, 1 lowercase, 1 uppercase and 1 number.";
			return;
	}




	/*
	hashing the passwords
	 */
	var hPass0 = sjcl.hash.sha256.hash(password+'0'); 
	hPass0 = sjcl.codec.base64.fromBits(hPass0);



	/*
	sending the hashed passwords to the server
	 */
	var xhr = new XMLHttpRequest();
	xhr.open('POST', "http://127.0.0.1:8081/", true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	var req = 'type=register&user='+username+'&hPass0='+hPass0;
	xhr.send(req);

	xhr.onreadystatechange = processRequest;

	function processRequest(e) {
		if (xhr.readyState == 4 && xhr.status == 200) {
			var response = xhr.responseText;
			if (response == "exist"){
				document.getElementById("message1").innerHTML = "Username is already taken, please choose another one";
			}
			if (response == "success"){
				document.getElementById("message1").innerHTML = (("Registeration succeded! You will go back in 3 seconds").bold()).fontcolor("green");
				setTimeout(registerToLogin, 3000);
			}	         


		}
	}

}

function checkPassword(str)
{
	// at least one number, one lowercase and one uppercase letter
	// at least six characters that are letters, numbers or the underscore
	var re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{6,}$/;
	console.log(str);
	console.log(re);
	console.log(re.test(str));
	return re.test(str);
}

function loginToRegister(){
	$("#login").fadeOut('slow', function () {$("#register").fadeIn('slow')});
}

function registerToLogin(){
	$("#register").fadeOut('slow', function () {$("#login").fadeIn('slow')});

}

function loginToConnected(){
	$("#login").fadeOut('slow', function () {$("#connected").fadeIn('slow')});

}

function connectedToLogin(){
	$("#connected").fadeOut('slow', function () {$("#login").fadeIn('slow')});

}


function setCookie(cname, cvalue, secs) {
	chrome.cookies.set({
    "name": cname,
    "value": cvalue,
    "url": "http://www.passmanager.com",
    "expirationDate": ((((new Date()).getTime())/1000)+(secs))
	});
}
