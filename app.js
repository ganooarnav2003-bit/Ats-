const STAGES = ['Applied','Screening','Interview','Offer','Hired','Rejected'];
const KEY = 'ats-data-v1';
const uid = () => Math.random().toString(36).slice(2, 10);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list = s => s.split(',').map(x => x.trim()).filter(Boolean);

let state = load();
let view = 'board';

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return d; } catch {}
  const j1 = uid(), j2 = uid();
  return {
    jobs: [
      {id:j1,title:'Frontend Engineer',dept:'Engineering',skills:['javascript','react','css'],status:'Open'},
      {id:j2,title:'Product Designer',dept:'Design',skills:['figma','ux','prototyping'],status:'Open'}
    ],
    candidates: [
      {id:uid(),name:'Asha Rao',email:'asha@example.com',phone:'',jobId:j1,stage:'Interview',skills:['javascript','react'],rating:4,notes:'Strong portfolio.'},
      {id:uid(),name:'Ben Lee',email:'ben@example.com',phone:'',jobId:j2,stage:'Applied',skills:['figma','ux'],rating:0,notes:''}
    ]
  };
}
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const job = id => state.jobs.find(j => j.id === id);

function match(c) {
  const j = job(c.jobId);
  if (!j || !j.skills.length) return null;
  const have = new Set(c.skills.map(s => s.toLowerCase()));
  const hit = j.skills.filter(s => have.has(s.toLowerCase())).length;
  return Math.round(100 * hit / j.skills.length);
}

function filtered() {
  const q = $('#search').value.toLowerCase(), jf = $('#jobFilter').value;
  return state.candidates.filter(c =>
    (!jf || c.jobId === jf) &&
    (!q || [c.name, c.email, c.skills.join(' '), c.notes].join(' ').toLowerCase().includes(q)));
}

function cardHtml(c) {
  const m = match(c), j = job(c.jobId);
  const jobSkills = new Set((j?.skills || []).map(s => s.toLowerCase()));
  return `<div class="card" draggable="true" data-id="${c.id}">
    ${m !== null ? `<span class="score">${m}%</span>` : ''}
    <b>${esc(c.name)}</b>
    <span class="muted">${esc(j?.title || 'No job')}${c.rating ? ' · ' + '★'.repeat(c.rating) : ''}</span><br>
    ${c.skills.map(s => `<span class="tag ${jobSkills.has(s.toLowerCase()) ? 'match' : ''}">${esc(s)}</span>`).join('')}
  </div>`;
}

function render() {
  for (const v of ['board','candidates','jobs']) $('#view-' + v).hidden = v !== view;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const jf = $('#jobFilter'), cur = jf.value;
  jf.innerHTML = '<option value="">All jobs</option>' + state.jobs.map(j => `<option value="${j.id}">${esc(j.title)}</option>`).join('');
  jf.value = cur;
  const cs = filtered();

  if (view === 'board') {
    $('#view-board').innerHTML = `<div class="stats">
      <div class="stat"><b>${cs.length}</b>Candidates</div>
      <div class="stat"><b>${state.jobs.filter(j => j.status === 'Open').length}</b>Open jobs</div>
      <div class="stat"><b>${cs.filter(c => c.stage === 'Hired').length}</b>Hired</div></div>
      <div class="board">${STAGES.map(s => `<div class="col" data-stage="${s}">
        <h3>${s} (${cs.filter(c => c.stage === s).length})</h3>
        ${cs.filter(c => c.stage === s).map(cardHtml).join('')}</div>`).join('')}</div>`;
  } else if (view === 'candidates') {
    $('#view-candidates').innerHTML = `<table><thead><tr><th>Name</th><th>Job</th><th>Stage</th><th>Match</th><th>Email</th></tr></thead><tbody>
      ${cs.map(c => { const m = match(c); return `<tr data-id="${c.id}"><td>${esc(c.name)}</td><td>${esc(job(c.jobId)?.title || '–')}</td><td>${c.stage}</td><td>${m ?? '–'}${m !== null ? '%' : ''}</td><td>${esc(c.email)}</td></tr>`; }).join('')}
      </tbody></table>`;
  } else {
    $('#view-jobs').innerHTML = `<p><button class="primary" id="addJob">+ Job</button></p><table><thead><tr><th>Title</th><th>Dept</th><th>Skills</th><th>Status</th><th>Applicants</th></tr></thead><tbody>
      ${state.jobs.map(j => `<tr data-job="${j.id}"><td>${esc(j.title)}</td><td>${esc(j.dept)}</td><td>${j.skills.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</td><td>${j.status}</td><td>${state.candidates.filter(c => c.jobId === j.id).length}</td></tr>`).join('')}
      </tbody></table>`;
  }
}

/* Candidate dialog */
const cd = $('#candidateDialog'), cf = $('#candidateForm');
let editing = null;
function openCandidate(id) {
  if (!state.jobs.length) return alert('Add a job first.');
  editing = id ? state.candidates.find(c => c.id === id) : null;
  cf.jobId.innerHTML = state.jobs.map(j => `<option value="${j.id}">${esc(j.title)}</option>`).join('');
  cf.stage.innerHTML = STAGES.map(s => `<option>${s}</option>`).join('');
  const c = editing || {name:'',email:'',phone:'',jobId:state.jobs[0].id,stage:'Applied',skills:[],rating:0,notes:''};
  $('#candidateTitle').textContent = editing ? 'Edit candidate' : 'New candidate';
  for (const k of ['name','email','phone','jobId','stage','rating','notes']) cf[k].value = c[k];
  cf.skills.value = c.skills.join(', ');
  $('#deleteCandidate').hidden = !editing;
  cd.showModal();
}
cf.addEventListener('submit', () => {
  const data = {
    name: cf.name.value.trim(), email: cf.email.value.trim(), phone: cf.phone.value.trim(),
    jobId: cf.jobId.value, stage: cf.stage.value, skills: list(cf.skills.value),
    rating: +cf.rating.value, notes: cf.notes.value
  };
  if (editing) Object.assign(editing, data); else state.candidates.push({id: uid(), ...data});
  save(); render();
});
$('#cancelCandidate').onclick = () => cd.close();
$('#deleteCandidate').onclick = () => {
  if (!confirm('Delete this candidate?')) return;
  state.candidates = state.candidates.filter(c => c !== editing);
  save(); cd.close(); render();
};

/* Job dialog */
const jd = $('#jobDialog'), jfm = $('#jobForm');
let editingJob = null;
function openJob(id) {
  editingJob = id ? job(id) : null;
  const j = editingJob || {title:'',dept:'',skills:[],status:'Open'};
  jfm.title.value = j.title; jfm.dept.value = j.dept; jfm.skills.value = j.skills.join(', '); jfm.status.value = j.status;
  jd.showModal();
}
jfm.addEventListener('submit', () => {
  const data = {title: jfm.title.value.trim(), dept: jfm.dept.value.trim(), skills: list(jfm.skills.value), status: jfm.status.value};
  if (editingJob) Object.assign(editingJob, data); else state.jobs.push({id: uid(), ...data});
  save(); render();
});
$('#cancelJob').onclick = () => jd.close();

/* Events */
document.querySelector('nav').onclick = e => { if (e.target.dataset.view) { view = e.target.dataset.view; render(); } };
$('#addCandidate').onclick = () => openCandidate();
$('#search').oninput = $('#jobFilter').onchange = render;
document.addEventListener('click', e => {
  if (e.target.id === 'addJob') return openJob();
  const card = e.target.closest('[data-id]'); if (card) return openCandidate(card.dataset.id);
  const jr = e.target.closest('[data-job]'); if (jr) openJob(jr.dataset.job);
});
document.addEventListener('dragstart', e => { const c = e.target.closest?.('.card'); if (c) e.dataTransfer.setData('text/plain', c.dataset.id); });
document.addEventListener('dragover', e => { const col = e.target.closest?.('.col'); if (col) { e.preventDefault(); col.classList.add('over'); } });
document.addEventListener('dragleave', e => e.target.closest?.('.col')?.classList.remove('over'));
document.addEventListener('drop', e => {
  const col = e.target.closest?.('.col'); if (!col) return;
  e.preventDefault();
  const c = state.candidates.find(x => x.id === e.dataTransfer.getData('text/plain'));
  if (c) { c.stage = col.dataset.stage; save(); }
  render();
});
render();
