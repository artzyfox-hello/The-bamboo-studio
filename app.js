document.addEventListener('DOMContentLoaded', () => {
  const authBox = document.getElementById('authBox');
  const studioBox = document.getElementById('studioBox');
  const paymentBox = document.getElementById('paymentBox');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const toggleAuth = document.getElementById('toggleAuth');
  const signUpFields = document.getElementById('signUpFields');

  const displayName = document.getElementById('displayName');
  const displayPronouns = document.getElementById('displayPronouns');
  const tierBadge = document.getElementById('tierBadge');
  const trialCountdown = document.getElementById('trialCountdown');
  const logoutBtn = document.getElementById('logoutBtn');

  const TEACHER_SECRET = "bambooteacher15";
  let isSignUpMode = false;
  let currentUser = null;

  toggleAuth.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    authTitle.innerText = isSignUpMode ? "Sign Up & Start 30-Day Trial" : "Sign In";
    authSubmitBtn.innerText = isSignUpMode ? "Create Account" : "Log In";
    toggleAuth.innerText = isSignUpMode ? "Already have an account? Log in" : "Need an account? Sign up";
    signUpFields.style.display = isSignUpMode ? "block" : "none";
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (isSignUpMode) {
      if (localStorage.getItem('bamboo_user_' + username)) {
        alert("Username already taken!");
        return;
      }

      const teacherCodeEntered = document.getElementById('teacherCode').value.trim();
      let assignedTier = document.getElementById('planTier').value;

      if (teacherCodeEntered.length > 0) {
        if (teacherCodeEntered === TEACHER_SECRET) {
          assignedTier = "teacher";
        } else {
          alert("Invalid Teacher Passcode. Registered as standard student.");
        }
      }

      const now = new Date();
      const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      currentUser = {
        username: username,
        password: password,
        prefName: document.getElementById('prefName').value.trim() || username,
        pronouns: document.getElementById('pronouns').value.trim() || "they/them",
        age: document.getElementById('age').value || 18,
        tier: assignedTier,
        signUpDate: now.toISOString(),
        trialEndDate: trialEnd.toISOString(),
        isPaid: false
      };

      localStorage.setItem('bamboo_user_' + username, JSON.stringify(currentUser));
      localStorage.setItem('bamboo_active_session', username);
      checkTrialAndRoute(currentUser);

    } else {
      const storedData = localStorage.getItem('bamboo_user_' + username);

      if (!storedData) {
        alert("User not found. Please sign up!");
        return;
      }

      const userData = JSON.parse(storedData);
      if (userData.password !== password) {
        alert("Incorrect password.");
        return;
      }

      currentUser = userData;
      localStorage.setItem('bamboo_active_session', username);
      checkTrialAndRoute(currentUser);
    }
  });

  function checkTrialAndRoute(user) {
    if (!user) return;

    // Default missing properties safely
    user.tier = user.tier || 'visitor';
    user.trialEndDate = user.trialEndDate || new Date(Date.now() + 30 * 86400000).toISOString();

    if (user.tier === 'teacher' || user.isPaid) {
      loadStudioUI(user);
      return;
    }

    const now = new Date();
    const trialExpiration = new Date(user.trialEndDate);

    if (now > trialExpiration && user.tier !== 'visitor') {
      authBox.style.display = 'none';
      paymentBox.style.display = 'block';
      studioBox.style.display = 'none';
    } else {
      const daysLeft = Math.max(0, Math.ceil((trialExpiration - now) / (1000 * 60 * 60 * 24)));
      trialCountdown.innerText = `30-Day Free Trial: ${daysLeft} days remaining`;
      loadStudioUI(user);
    }
  }

  function selectPlanPayment(selectedTier) {
    currentUser.tier = selectedTier;
    currentUser.isPaid = true;
    localStorage.setItem('bamboo_user_' + currentUser.username, JSON.stringify(currentUser));
    alert(`Plan updated to ${selectedTier}!`);
    paymentBox.style.display = 'none';
    loadStudioUI(currentUser);
  }

  function loadStudioUI(user) {
    authBox.style.display = 'none';
    
    const safeTier = user.tier || 'visitor';
    displayName.innerText = user.prefName || user.username || "User";
    displayPronouns.innerText = `(${user.pronouns || 'they/them'})`;
    tierBadge.innerText = safeTier.replace('_', ' ');
    tierBadge.className = `badge badge-${safeTier}`;
    
    studioBox.style.display = 'flex';
  }

  document.getElementById('payStudentBtn').addEventListener('click', () => selectPlanPayment('student'));
  document.getElementById('payPlusBtn').addEventListener('click', () => selectPlanPayment('student_plus'));
  document.getElementById('payAsyncBtn').addEventListener('click', () => selectPlanPayment('save_and_play'));
  document.getElementById('payVisitorBtn').addEventListener('click', () => selectPlanPayment('visitor'));

  document.getElementById('joinSoloBtn').addEventListener('click', () => alert('Joining Solo Practice...'));
  document.getElementById('joinGroupBtn').addEventListener('click', () => {
    if (currentUser && currentUser.tier === 'visitor') {
      alert("Visitor tier gives access to Solo Practice rooms only.");
    } else {
      alert('Joining Group Studio...');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('bamboo_active_session');
    studioBox.style.display = 'none';
    paymentBox.style.display = 'none';
    authBox.style.display = 'block';
    authForm.reset();
  });

  // Auto-login session loader
  try {
    const activeUser = localStorage.getItem('bamboo_active_session');
    if (activeUser) {
      const storedData = localStorage.getItem('bamboo_user_' + activeUser);
      if (storedData) {
        currentUser = JSON.parse(storedData);
        checkTrialAndRoute(currentUser);
      }
    }
  } catch (err) {
    console.error("Session load failed, clearing session.", err);
    localStorage.removeItem('bamboo_active_session');
  }
});
