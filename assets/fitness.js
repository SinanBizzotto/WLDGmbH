(function () {
  const STORAGE_KEY = 'fitness-training-suite-v1';

  const equipmentLibrary = [
    {
      id: 'bike',
      name: 'LifeCycle Bike',
      muscle: 'Cardio',
      image: 'assets/fitness/bike.jpeg',
      defaultExercise: 'Bike Intervall',
      work: 300,
      rest: 60,
      sets: 1,
      calories: 55,
      description: 'Ideal für Warm-up, lockeres Ausfahren oder strukturierte Cardio-Intervalle.'
    },
    {
      id: 'treadmill',
      name: 'Sportstech Laufband',
      muscle: 'Cardio',
      image: 'assets/fitness/treadmill.jpeg',
      defaultExercise: 'Laufband Tempo-Block',
      work: 420,
      rest: 90,
      sets: 1,
      calories: 80,
      description: 'Für Ausdauer, Steigungsläufe oder saubere Intervallblöcke mit Pace-Steuerung.'
    },
    {
      id: 'dumbbells',
      name: 'Kurzhantel-Rack',
      muscle: 'Ganzkörper',
      image: 'assets/fitness/dumbbells.jpeg',
      defaultExercise: 'Kurzhantel Komplex',
      work: 45,
      rest: 30,
      sets: 4,
      calories: 16,
      description: 'Freies Training für Push, Pull, Lunges, Rows oder Shoulder Press. Brutal vielseitig.'
    },
    {
      id: 'stairmaster',
      name: 'StairMaster',
      muscle: 'Cardio',
      image: 'assets/fitness/stairmaster.jpeg',
      defaultExercise: 'StairMaster Climb',
      work: 240,
      rest: 60,
      sets: 1,
      calories: 70,
      description: 'Treppenintervalle für Kondition und Beinbrennen. Ja, die Lunge meldet sich.'
    },
    {
      id: 'crunch',
      name: 'Crunch / Sit-up Maschine',
      muscle: 'Core',
      image: 'assets/fitness/crunch.jpeg',
      defaultExercise: 'Crunch Maschine',
      work: 40,
      rest: 25,
      sets: 4,
      calories: 10,
      description: 'Gezielte Bauchspannung mit kontrollierter Ausführung und klarer Time-under-Tension.'
    },
    {
      id: 'legcurl',
      name: 'Leg Curl sitzend',
      muscle: 'Beine',
      image: 'assets/fitness/legcurl.jpeg',
      defaultExercise: 'Leg Curl',
      work: 40,
      rest: 30,
      sets: 4,
      calories: 12,
      description: 'Isoliert die hintere Oberschenkelkette. Wichtig für Kniebalance und Sprintpower.'
    },
    {
      id: 'legextension',
      name: 'Leg Extension',
      muscle: 'Beine',
      image: 'assets/fitness/legextension.jpeg',
      defaultExercise: 'Leg Extension',
      work: 40,
      rest: 30,
      sets: 4,
      calories: 12,
      description: 'Quadrizeps-Fokus mit sauberer Spitze im Lockout. Klassischer Brenner.'
    },
    {
      id: 'hackenschmidt',
      name: 'Hackenschmidt / Squat Press',
      muscle: 'Beine',
      image: 'assets/fitness/hackenschmidt.jpeg',
      defaultExercise: 'Hack Squat',
      work: 45,
      rest: 45,
      sets: 4,
      calories: 18,
      description: 'Schwerer Beinblock mit geführter Linie. Für Quadrizeps und Gesäß richtig böse.'
    },
    {
      id: 'backextension',
      name: 'Back Extension / Rückenstrecker',
      muscle: 'Rücken',
      image: 'assets/fitness/backextension.jpeg',
      defaultExercise: 'Back Extension',
      work: 45,
      rest: 30,
      sets: 3,
      calories: 10,
      description: 'Trainiert unteren Rücken, Gesäß und Haltung. Saubere Kontrolle statt Cowboy-Schwung.'
    },
    {
      id: 'legpress',
      name: '45° Leg Press',
      muscle: 'Beine',
      image: 'assets/fitness/legpress.jpeg',
      defaultExercise: 'Leg Press',
      work: 50,
      rest: 45,
      sets: 4,
      calories: 18,
      description: 'Massiv für Beine und Gluteus. Perfekt für Volumen, Kraft oder Finisher.'
    }
  ];

  const state = {
    sessionName: '',
    sessionNotes: '',
    warmupMinutes: 5,
    defaultWork: 45,
    defaultRest: 30,
    defaultSets: 3,
    autostartRest: true,
    soundEnabled: true,
    exercises: [],
    runner: {
      active: false,
      paused: false,
      currentExerciseIndex: 0,
      currentSet: 1,
      phase: 'idle',
      timeLeft: 0,
      phaseDuration: 0,
      intervalId: null,
      finishedExerciseIds: []
    }
  };

  const els = {
    equipmentGrid: document.getElementById('equipmentGrid'),
    equipmentSearch: document.getElementById('equipmentSearch'),
    muscleFilter: document.getElementById('muscleFilter'),
    exerciseList: document.getElementById('exerciseList'),
    sessionName: document.getElementById('sessionName'),
    defaultWork: document.getElementById('defaultWork'),
    defaultRest: document.getElementById('defaultRest'),
    defaultSets: document.getElementById('defaultSets'),
    warmupMinutes: document.getElementById('warmupMinutes'),
    sessionNotes: document.getElementById('sessionNotes'),
    autostartRest: document.getElementById('autostartRest'),
    soundEnabled: document.getElementById('soundEnabled'),
    savePlanBtn: document.getElementById('savePlanBtn'),
    resetPlanBtn: document.getElementById('resetPlanBtn'),
    clearExercisesBtn: document.getElementById('clearExercisesBtn'),
    loadDemoPlan: document.getElementById('loadDemoPlan'),
    summarySessionName: document.getElementById('summarySessionName'),
    summaryExerciseCount: document.getElementById('summaryExerciseCount'),
    summaryTotalTime: document.getElementById('summaryTotalTime'),
    summaryWorkTime: document.getElementById('summaryWorkTime'),
    summaryRestTime: document.getElementById('summaryRestTime'),
    startSessionBtn: document.getElementById('startSessionBtn'),
    pauseSessionBtn: document.getElementById('pauseSessionBtn'),
    skipPhaseBtn: document.getElementById('skipPhaseBtn'),
    restartPhaseBtn: document.getElementById('restartPhaseBtn'),
    finishSessionBtn: document.getElementById('finishSessionBtn'),
    timerDisplay: document.getElementById('timerDisplay'),
    phaseBadge: document.getElementById('phaseBadge'),
    progressBarFill: document.getElementById('progressBarFill'),
    currentExerciseName: document.getElementById('currentExerciseName'),
    currentSet: document.getElementById('currentSet'),
    nextPhase: document.getElementById('nextPhase'),
    analyticsProgress: document.getElementById('analyticsProgress'),
    analyticsDone: document.getElementById('analyticsDone'),
    analyticsRemaining: document.getElementById('analyticsRemaining'),
    analyticsEndTime: document.getElementById('analyticsEndTime'),
    exportPlanBtn: document.getElementById('exportPlanBtn'),
    importJson: document.getElementById('importJson'),
    importPlanBtn: document.getElementById('importPlanBtn')
  };

  const equipmentTemplate = document.getElementById('equipmentCardTemplate');
  const exerciseTemplate = document.getElementById('exerciseItemTemplate');

  function uid() {
    return `ex_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatMinutes(seconds) {
    return `${Math.ceil(seconds / 60)} Min.`;
  }

  function estimateEndTime(totalSeconds) {
    if (!totalSeconds) return '—';
    const d = new Date(Date.now() + totalSeconds * 1000);
    return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  }

  function beep() {
    if (!state.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.04;
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (err) {
      // silent fail, the browser circus sometimes blocks audio until interaction
    }
  }

  function cloneExerciseFromEquipment(item) {
    return {
      uid: uid(),
      equipmentId: item.id,
      name: item.defaultExercise,
      muscle: item.muscle,
      work: state.defaultWork || item.work,
      rest: state.defaultRest || item.rest,
      sets: state.defaultSets || item.sets,
      intensity: '',
      calories: item.calories,
      notes: item.description
    };
  }

  function computeTotals() {
    const warmup = (Number(state.warmupMinutes) || 0) * 60;
    const work = state.exercises.reduce((sum, ex) => sum + ex.work * ex.sets, 0);
    const rest = state.exercises.reduce((sum, ex) => sum + ex.rest * Math.max(0, ex.sets - 1), 0);
    const total = warmup + work + rest;
    return { warmup, work, rest, total };
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionName: state.sessionName,
      sessionNotes: state.sessionNotes,
      warmupMinutes: state.warmupMinutes,
      defaultWork: state.defaultWork,
      defaultRest: state.defaultRest,
      defaultSets: state.defaultSets,
      autostartRest: state.autostartRest,
      soundEnabled: state.soundEnabled,
      exercises: state.exercises
    }));
  }

  function loadPersisted() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      if (!Array.isArray(parsed.exercises)) state.exercises = [];
    } catch (err) {
      console.warn('Plan konnte nicht geladen werden', err);
    }
  }

  function syncForm() {
    els.sessionName.value = state.sessionName || '';
    els.sessionNotes.value = state.sessionNotes || '';
    els.warmupMinutes.value = state.warmupMinutes;
    els.defaultWork.value = state.defaultWork;
    els.defaultRest.value = state.defaultRest;
    els.defaultSets.value = state.defaultSets;
    els.autostartRest.checked = !!state.autostartRest;
    els.soundEnabled.checked = !!state.soundEnabled;
  }

  function updateSummary() {
    const totals = computeTotals();
    els.summarySessionName.textContent = state.sessionName || 'Individueller Trainingsplan';
    els.summaryExerciseCount.textContent = String(state.exercises.length);
    els.summaryTotalTime.textContent = formatMinutes(totals.total || 0);
    els.summaryWorkTime.textContent = formatMinutes(totals.work || 0);
    els.summaryRestTime.textContent = formatMinutes(totals.rest || 0);

    const done = state.runner.finishedExerciseIds.length;
    const remaining = Math.max(0, state.exercises.length - done);
    const progress = state.exercises.length ? Math.round((done / state.exercises.length) * 100) : 0;

    els.analyticsProgress.textContent = `${progress}%`;
    els.analyticsDone.textContent = String(done);
    els.analyticsRemaining.textContent = String(remaining);
    els.analyticsEndTime.textContent = estimateEndTime(totals.total);
  }

  function renderEquipment() {
    const term = (els.equipmentSearch.value || '').trim().toLowerCase();
    const muscle = els.muscleFilter.value;

    const filtered = equipmentLibrary.filter(item => {
      const matchesText = !term || [item.name, item.defaultExercise, item.muscle, item.description].join(' ').toLowerCase().includes(term);
      const matchesMuscle = muscle === 'all' || item.muscle === muscle;
      return matchesText && matchesMuscle;
    });

    els.equipmentGrid.innerHTML = '';

    filtered.forEach(item => {
      const node = equipmentTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('.equipmentCard__image').src = item.image;
      node.querySelector('.equipmentCard__image').alt = item.name;
      node.querySelector('.equipmentCard__title').textContent = item.name;
      node.querySelector('.equipmentCard__subtitle').textContent = item.defaultExercise;
      node.querySelector('.equipmentCard__pill').textContent = item.muscle;
      node.querySelector('.equipmentCard__description').textContent = item.description;
      node.querySelector('.equipmentCard__add').addEventListener('click', () => {
        state.exercises.push(cloneExerciseFromEquipment(item));
        persist();
        renderExercises();
        updateSummary();
      });
      els.equipmentGrid.appendChild(node);
    });
  }

  function renderExercises() {
    if (!state.exercises.length) {
      els.exerciseList.className = 'exerciseList emptyState';
      els.exerciseList.textContent = 'Noch keine Übung im Plan. Wähle oben ein Gerät aus. Die Maschine macht nichts, wenn man sie nicht füttert.';
      return;
    }

    els.exerciseList.className = 'exerciseList';
    els.exerciseList.innerHTML = '';

    state.exercises.forEach((exercise, index) => {
      const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.uid = exercise.uid;
      node.querySelector('.exerciseItem__title').textContent = exercise.name;
      node.querySelector('.exerciseItem__meta').textContent = `${exercise.muscle} • ${exercise.sets} Sätze • ${exercise.work}s Arbeit / ${exercise.rest}s Pause`;

      node.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        input.value = exercise[field] ?? '';
        input.addEventListener('input', (e) => {
          const value = ['work', 'rest', 'sets', 'calories'].includes(field) ? Number(e.target.value || 0) : e.target.value;
          exercise[field] = value;
          renderExercises();
          updateSummary();
          persist();
        });
      });

      node.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'delete') {
            state.exercises.splice(index, 1);
          }
          if (action === 'up' && index > 0) {
            [state.exercises[index - 1], state.exercises[index]] = [state.exercises[index], state.exercises[index - 1]];
          }
          if (action === 'down' && index < state.exercises.length - 1) {
            [state.exercises[index + 1], state.exercises[index]] = [state.exercises[index], state.exercises[index + 1]];
          }
          persist();
          renderExercises();
          updateSummary();
        });
      });

      els.exerciseList.appendChild(node);
    });
  }

  function resetRunnerUi() {
    els.timerDisplay.textContent = '00:00';
    els.phaseBadge.textContent = 'Bereit';
    els.phaseBadge.className = 'phaseBadge';
    els.currentExerciseName.textContent = '—';
    els.currentSet.textContent = '—';
    els.nextPhase.textContent = '—';
    els.progressBarFill.style.width = '0%';
  }

  function stopInterval() {
    if (state.runner.intervalId) {
      clearInterval(state.runner.intervalId);
      state.runner.intervalId = null;
    }
  }

  function finishSession() {
    stopInterval();
    state.runner.active = false;
    state.runner.paused = false;
    state.runner.phase = 'done';
    els.phaseBadge.textContent = 'Session beendet';
    els.phaseBadge.className = 'phaseBadge isDone';
    els.nextPhase.textContent = '—';
    els.progressBarFill.style.width = '100%';
    beep();
  }

  function startPhase(phase, duration) {
    state.runner.phase = phase;
    state.runner.timeLeft = duration;
    state.runner.phaseDuration = duration;
    updateRunnerUi();
    stopInterval();
    state.runner.intervalId = setInterval(tick, 1000);
  }

  function moveToNextPhase() {
    const exercise = state.exercises[state.runner.currentExerciseIndex];
    if (!exercise) {
      finishSession();
      return;
    }

    if (state.runner.phase === 'warmup') {
      startPhase('work', exercise.work);
      beep();
      return;
    }

    if (state.runner.phase === 'work') {
      if (state.runner.currentSet < exercise.sets) {
        if (exercise.rest > 0) {
          if (state.autostartRest) {
            startPhase('rest', exercise.rest);
          } else {
            stopInterval();
            state.runner.phase = 'waitingRest';
            state.runner.timeLeft = exercise.rest;
            state.runner.phaseDuration = exercise.rest;
            updateRunnerUi();
          }
        } else {
          state.runner.currentSet += 1;
          startPhase('work', exercise.work);
        }
        return;
      }

      state.runner.finishedExerciseIds.push(exercise.uid);
      state.runner.currentExerciseIndex += 1;
      state.runner.currentSet = 1;
      const nextExercise = state.exercises[state.runner.currentExerciseIndex];
      if (!nextExercise) {
        finishSession();
        updateSummary();
        return;
      }
      startPhase('work', nextExercise.work);
      beep();
      updateSummary();
      return;
    }

    if (state.runner.phase === 'rest' || state.runner.phase === 'waitingRest') {
      state.runner.currentSet += 1;
      startPhase('work', exercise.work);
      beep();
      return;
    }
  }

  function tick() {
    if (!state.runner.active || state.runner.paused) return;
    state.runner.timeLeft -= 1;
    if (state.runner.timeLeft <= 0) {
      moveToNextPhase();
      return;
    }
    updateRunnerUi();
  }

  function updateRunnerUi() {
    const exercise = state.exercises[state.runner.currentExerciseIndex];
    const phaseMap = {
      idle: ['Bereit', 'phaseBadge'],
      warmup: ['Warm-up', 'phaseBadge isWork'],
      work: ['Arbeit', 'phaseBadge isWork'],
      rest: ['Pause', 'phaseBadge isRest'],
      waitingRest: ['Pause bereit', 'phaseBadge isRest'],
      done: ['Fertig', 'phaseBadge isDone']
    };

    const [label, className] = phaseMap[state.runner.phase] || phaseMap.idle;
    els.phaseBadge.textContent = label;
    els.phaseBadge.className = className;
    els.timerDisplay.textContent = formatTime(state.runner.timeLeft);
    els.currentExerciseName.textContent = exercise ? exercise.name : '—';
    els.currentSet.textContent = exercise ? `${state.runner.currentSet} / ${exercise.sets}` : '—';

    let next = '—';
    if (state.runner.phase === 'work') next = exercise && state.runner.currentSet < exercise.sets ? 'Pause' : 'Nächste Übung';
    if (state.runner.phase === 'rest' || state.runner.phase === 'waitingRest') next = 'Nächster Satz';
    if (state.runner.phase === 'warmup') next = 'Erste Übung';
    els.nextPhase.textContent = next;

    const progress = state.runner.phaseDuration > 0
      ? ((state.runner.phaseDuration - state.runner.timeLeft) / state.runner.phaseDuration) * 100
      : 0;
    els.progressBarFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  function startSession() {
    if (!state.exercises.length) {
      alert('Du brauchst mindestens eine Übung im Plan. Sonst starrt dich der Timer nur beleidigt an.');
      return;
    }

    stopInterval();
    state.runner.active = true;
    state.runner.paused = false;
    state.runner.currentExerciseIndex = 0;
    state.runner.currentSet = 1;
    state.runner.finishedExerciseIds = [];

    const warmupSeconds = (Number(state.warmupMinutes) || 0) * 60;
    if (warmupSeconds > 0) {
      startPhase('warmup', warmupSeconds);
    } else {
      startPhase('work', state.exercises[0].work);
    }
    updateSummary();
  }

  function bindControls() {
    ['sessionName', 'sessionNotes'].forEach(key => {
      els[key].addEventListener('input', e => {
        state[key] = e.target.value;
        updateSummary();
        persist();
      });
    });

    ['warmupMinutes', 'defaultWork', 'defaultRest', 'defaultSets'].forEach(key => {
      els[key].addEventListener('input', e => {
        state[key] = Number(e.target.value || 0);
        updateSummary();
        persist();
      });
    });

    ['autostartRest', 'soundEnabled'].forEach(key => {
      els[key].addEventListener('change', e => {
        state[key] = e.target.checked;
        persist();
      });
    });

    els.equipmentSearch.addEventListener('input', renderEquipment);
    els.muscleFilter.addEventListener('change', renderEquipment);

    els.savePlanBtn.addEventListener('click', () => {
      persist();
      alert('Plan gespeichert. Lokal im Browser, ohne Datenbank-Zirkus.');
    });

    els.resetPlanBtn.addEventListener('click', () => {
      if (!confirm('Wirklich alles zurücksetzen?')) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });

    els.clearExercisesBtn.addEventListener('click', () => {
      state.exercises = [];
      persist();
      renderExercises();
      updateSummary();
      finishSession();
      resetRunnerUi();
    });

    els.loadDemoPlan.addEventListener('click', () => {
      state.sessionName = 'Demo Ganzkörper';
      state.sessionNotes = 'Beispielplan für Gerätezirkel';
      state.exercises = [
        cloneExerciseFromEquipment(equipmentLibrary[0]),
        cloneExerciseFromEquipment(equipmentLibrary[2]),
        cloneExerciseFromEquipment(equipmentLibrary[5]),
        cloneExerciseFromEquipment(equipmentLibrary[9]),
        cloneExerciseFromEquipment(equipmentLibrary[8])
      ];
      state.exercises[1].name = 'Kurzhantel Rudern';
      state.exercises[1].muscle = 'Rücken';
      state.exercises[1].intensity = 'mittel';
      syncForm();
      persist();
      renderExercises();
      updateSummary();
    });

    els.startSessionBtn.addEventListener('click', startSession);

    els.pauseSessionBtn.addEventListener('click', () => {
      if (!state.runner.active) return;
      state.runner.paused = !state.runner.paused;
      els.pauseSessionBtn.textContent = state.runner.paused ? 'Fortsetzen' : 'Pause';
    });

    els.skipPhaseBtn.addEventListener('click', () => {
      if (!state.runner.active) return;
      moveToNextPhase();
    });

    els.restartPhaseBtn.addEventListener('click', () => {
      if (!state.runner.active) return;
      state.runner.timeLeft = state.runner.phaseDuration;
      updateRunnerUi();
    });

    els.finishSessionBtn.addEventListener('click', finishSession);

    document.querySelectorAll('[data-adjust]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.runner.active) return;
        state.runner.timeLeft = Math.max(0, state.runner.timeLeft + Number(btn.dataset.adjust));
        state.runner.phaseDuration = Math.max(state.runner.timeLeft, state.runner.phaseDuration);
        updateRunnerUi();
      });
    });

    els.exportPlanBtn.addEventListener('click', async () => {
      const payload = JSON.stringify({
        sessionName: state.sessionName,
        sessionNotes: state.sessionNotes,
        warmupMinutes: state.warmupMinutes,
        defaultWork: state.defaultWork,
        defaultRest: state.defaultRest,
        defaultSets: state.defaultSets,
        autostartRest: state.autostartRest,
        soundEnabled: state.soundEnabled,
        exercises: state.exercises
      }, null, 2);

      els.importJson.value = payload;
      try {
        await navigator.clipboard.writeText(payload);
      } catch (err) {
        // clipboard can fail, not fatal
      }
    });

    els.importPlanBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(els.importJson.value);
        state.sessionName = parsed.sessionName || '';
        state.sessionNotes = parsed.sessionNotes || '';
        state.warmupMinutes = Number(parsed.warmupMinutes || 0);
        state.defaultWork = Number(parsed.defaultWork || 45);
        state.defaultRest = Number(parsed.defaultRest || 30);
        state.defaultSets = Number(parsed.defaultSets || 3);
        state.autostartRest = !!parsed.autostartRest;
        state.soundEnabled = !!parsed.soundEnabled;
        state.exercises = Array.isArray(parsed.exercises) ? parsed.exercises.map(ex => ({ ...ex, uid: ex.uid || uid() })) : [];
        syncForm();
        persist();
        renderExercises();
        updateSummary();
      } catch (err) {
        alert('JSON ist ungültig. Da hat der Datenkobold zugeschlagen.');
      }
    });
  }

  function init() {
    loadPersisted();
    syncForm();
    renderEquipment();
    renderExercises();
    updateSummary();
    resetRunnerUi();
    bindControls();
  }

  init();
})();
