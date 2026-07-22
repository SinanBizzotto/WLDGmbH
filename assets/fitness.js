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
    importPlanBtn: document.getElementById('importPlanBtn'),
    sessionProgressFill: document.getElementById('sessionProgressFill'),
    sessionProgressLabel: document.getElementById('sessionProgressLabel'),
    focusModeBtn: document.getElementById('focusModeBtn'),
    focusOverlay: document.getElementById('focusOverlay'),
    focusCloseBtn: document.getElementById('focusCloseBtn'),
    focusPhase: document.getElementById('focusPhase'),
    focusTimer: document.getElementById('focusTimer'),
    focusProgressFill: document.getElementById('focusProgressFill'),
    focusExercise: document.getElementById('focusExercise'),
    focusSet: document.getElementById('focusSet'),
    focusNext: document.getElementById('focusNext'),
    focusPauseBtn: document.getElementById('focusPauseBtn'),
    focusSkipBtn: document.getElementById('focusSkipBtn'),
    planCountBadge: document.getElementById('planCountBadge'),
    bottomPlanCount: document.getElementById('bottomPlanCount'),
    fitToday: document.getElementById('fitToday')
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

  // ---------- Toast + confirm (replace jarring native alert/confirm) ----------
  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector('.fitToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'fitToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function confirmDialog(message) {
    return new Promise((resolve) => {
      let dialog = document.querySelector('.fitConfirm');
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.className = 'fitConfirm';
        dialog.innerHTML = `
          <div class="fitConfirm__body">
            <p class="fitConfirm__msg"></p>
            <div class="fitConfirm__actions">
              <button type="button" class="btn btn--ghost" data-action="cancel">Abbrechen</button>
              <button type="button" class="btn" data-action="confirm">Bestätigen</button>
            </div>
          </div>`;
        document.body.appendChild(dialog);
      }
      dialog.querySelector('.fitConfirm__msg').textContent = message;

      const onClick = (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        cleanup();
        dialog.close();
        resolve(action === 'confirm');
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      function cleanup() {
        dialog.removeEventListener('click', onClick);
        dialog.removeEventListener('cancel', onCancel);
      }
      dialog.addEventListener('click', onClick);
      dialog.addEventListener('cancel', onCancel);
      dialog.showModal();
    });
  }

  // ---------- Wake Lock (screen stays on during an active session) ----------
  let wakeLock = null;
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (err) {
      // not supported / denied — non-critical, session still works without it
    }
  }
  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.runner.active && !state.runner.paused && !wakeLock) {
      requestWakeLock();
    }
  });

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
    els.planCountBadge.textContent = String(state.exercises.length);
    els.bottomPlanCount.textContent = String(state.exercises.length);

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
      node.querySelector('.equipmentCard__add').addEventListener('click', (e) => {
        state.exercises.push(cloneExerciseFromEquipment(item));
        persist();
        renderExercises();
        updateSummary();
        navigator.vibrate?.(18);

        const btn = e.currentTarget;
        const label = btn.querySelector('span');
        const icon = btn.querySelector('b');
        label.textContent = 'Hinzugefügt';
        icon.textContent = '✓';
        btn.classList.add('is-added');
        clearTimeout(btn._resetTimer);
        btn._resetTimer = setTimeout(() => {
          label.textContent = 'Hinzufügen';
          icon.textContent = '＋';
          btn.classList.remove('is-added');
        }, 1100);
        showToast(`${item.defaultExercise} hinzugefügt`);
      });
      els.equipmentGrid.appendChild(node);
    });
  }

  function renderExercises() {
    if (!state.exercises.length) {
      els.exerciseList.className = 'exerciseList emptyState';
      els.exerciseList.textContent = 'Noch keine Übung im Plan. Wähle zuerst ein Gerät aus.';
      return;
    }

    els.exerciseList.className = 'exerciseList';
    els.exerciseList.innerHTML = '';

    state.exercises.forEach((exercise, index) => {
      const node = exerciseTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.uid = exercise.uid;
      const title = node.querySelector('.exerciseItem__title');
      const meta = node.querySelector('.exerciseItem__meta');
      const refreshCardText = () => {
        title.textContent = exercise.name;
        meta.textContent = `${exercise.muscle} • ${exercise.sets} Sätze • ${exercise.work}s / ${exercise.rest}s Pause`;
      };
      refreshCardText();

      node.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        input.value = exercise[field] ?? '';
        input.addEventListener('input', (e) => {
          const value = ['work', 'rest', 'sets', 'calories'].includes(field) ? Number(e.target.value || 0) : e.target.value;
          exercise[field] = value;
          refreshCardText();
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

    updateExerciseHighlight(false);
  }

  function updateExerciseHighlight(scrollToCurrent) {
    const currentExercise = state.exercises[state.runner.currentExerciseIndex];
    els.exerciseList.querySelectorAll('.exerciseItem').forEach((node) => {
      const isCurrent = state.runner.active && currentExercise && node.dataset.uid === currentExercise.uid;
      const isDone = state.runner.finishedExerciseIds.includes(node.dataset.uid);
      node.classList.toggle('is-current', !!isCurrent);
      node.classList.toggle('is-done', isDone);
      if (isCurrent && scrollToCurrent) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  function updateSessionProgress() {
    const total = state.exercises.length;
    const done = state.runner.finishedExerciseIds.length;
    const currentIndex = Math.min(state.runner.currentExerciseIndex, Math.max(0, total - 1));
    const pct = total ? Math.round((done / total) * 100) : 0;

    els.sessionProgressFill.style.width = `${pct}%`;

    if (!total) {
      els.sessionProgressLabel.textContent = 'Noch keine Übung im Plan';
    } else if (!state.runner.active) {
      els.sessionProgressLabel.textContent = `${total} Übung${total === 1 ? '' : 'en'} bereit`;
    } else if (state.runner.phase === 'done') {
      els.sessionProgressLabel.textContent = `Session beendet – ${total} von ${total} Übungen`;
    } else {
      els.sessionProgressLabel.textContent = `Übung ${currentIndex + 1} von ${total}`;
    }
  }

  function resetRunnerUi() {
    els.timerDisplay.textContent = '00:00';
    els.phaseBadge.textContent = 'Bereit';
    els.phaseBadge.className = 'phaseBadge';
    els.currentExerciseName.textContent = '—';
    els.currentSet.textContent = '—';
    els.nextPhase.textContent = '—';
    els.progressBarFill.style.width = '0%';
    els.focusTimer.textContent = '00:00';
    els.focusPhase.textContent = 'Bereit';
    els.focusPhase.className = 'focusOverlay__phase';
    els.focusExercise.textContent = '—';
    els.focusSet.textContent = 'Satz —';
    els.focusNext.textContent = 'Nächste Phase —';
    els.focusProgressFill.style.width = '0%';
    updateSessionProgress();
    updateExerciseHighlight(false);
  }

  function stopInterval() {
    if (state.runner.intervalId) {
      clearInterval(state.runner.intervalId);
      state.runner.intervalId = null;
    }
  }

  function finishSession() {
    stopInterval();
    releaseWakeLock();
    state.runner.active = false;
    state.runner.paused = false;
    state.runner.phase = 'done';
    els.phaseBadge.textContent = 'Session beendet';
    els.phaseBadge.className = 'phaseBadge isDone';
    els.nextPhase.textContent = '—';
    els.progressBarFill.style.width = '100%';
    els.pauseSessionBtn.textContent = 'Pause';
    els.focusPauseBtn.textContent = 'Pause';
    els.focusPhase.textContent = 'Session beendet';
    els.focusPhase.className = 'focusOverlay__phase isDone';
    updateSessionProgress();
    updateExerciseHighlight(false);
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

  let lastHighlightedIndex = -1;

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

    // Focus-Modus (grossflächige Anzeige) synchron halten
    els.focusPhase.textContent = label.replace('Fertig', 'Session beendet');
    els.focusPhase.className = `focusOverlay__phase ${className.replace('phaseBadge', '').trim()}`.trim();
    els.focusTimer.textContent = els.timerDisplay.textContent;
    els.focusExercise.textContent = exercise ? exercise.name : '—';
    els.focusSet.textContent = exercise ? `Satz ${state.runner.currentSet} / ${exercise.sets}` : 'Satz —';
    els.focusNext.textContent = `Nächste Phase: ${next}`;
    els.focusProgressFill.style.width = els.progressBarFill.style.width;

    const exerciseChanged = state.runner.currentExerciseIndex !== lastHighlightedIndex;
    lastHighlightedIndex = state.runner.currentExerciseIndex;
    updateExerciseHighlight(exerciseChanged);
    updateSessionProgress();
  }

  function startSession() {
    if (!state.exercises.length) {
      showToast('Du brauchst mindestens eine Übung im Plan.');
      return;
    }

    stopInterval();
    state.runner.active = true;
    state.runner.paused = false;
    state.runner.currentExerciseIndex = 0;
    state.runner.currentSet = 1;
    state.runner.finishedExerciseIds = [];
    lastHighlightedIndex = -1;
    els.pauseSessionBtn.textContent = 'Pause';
    els.focusPauseBtn.textContent = 'Pause';

    requestWakeLock();

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
      showToast('Plan gespeichert ✓');
    });

    els.resetPlanBtn.addEventListener('click', async () => {
      const ok = await confirmDialog('Wirklich alles zurücksetzen? Das kann nicht rückgängig gemacht werden.');
      if (!ok) return;
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
      showToast('Demo-Plan mit 5 Übungen geladen');
    });

    els.startSessionBtn.addEventListener('click', startSession);

    const togglePause = () => {
      if (!state.runner.active) return;
      state.runner.paused = !state.runner.paused;
      const label = state.runner.paused ? 'Fortsetzen' : 'Pause';
      els.pauseSessionBtn.textContent = label;
      els.focusPauseBtn.textContent = label;
      if (!state.runner.paused) requestWakeLock();
    };
    els.pauseSessionBtn.addEventListener('click', togglePause);
    els.focusPauseBtn.addEventListener('click', togglePause);

    const skipPhase = () => {
      if (!state.runner.active) return;
      moveToNextPhase();
    };
    els.skipPhaseBtn.addEventListener('click', skipPhase);
    els.focusSkipBtn.addEventListener('click', skipPhase);

    els.restartPhaseBtn.addEventListener('click', () => {
      if (!state.runner.active) return;
      state.runner.timeLeft = state.runner.phaseDuration;
      updateRunnerUi();
    });

    els.finishSessionBtn.addEventListener('click', finishSession);

    els.focusModeBtn.addEventListener('click', () => {
      els.focusOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    els.focusCloseBtn.addEventListener('click', () => {
      els.focusOverlay.hidden = true;
      document.body.style.overflow = '';
    });

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
        showToast('JSON ist ungültig. Bitte Format prüfen.');
      }
    });
  }

  function init() {
    if (els.fitToday) {
      els.fitToday.textContent = new Intl.DateTimeFormat('de-CH', {
        weekday: 'long', day: '2-digit', month: 'long'
      }).format(new Date()).toUpperCase();
    }
    loadPersisted();
    syncForm();
    renderEquipment();
    renderExercises();
    updateSummary();
    resetRunnerUi();
    bindControls();

    const navLinks = [...document.querySelectorAll('.fitBottomNav a')];
    const sections = navLinks
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if ('IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
        });
      }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .1, .5] });
      sections.forEach(section => navObserver.observe(section));
    }
  }

  init();
})();
