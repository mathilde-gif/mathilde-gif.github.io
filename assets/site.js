const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('is-open', expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open');
    }
  });
}

async function copyText(value, status) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
    else {
      const temp = document.createElement('textarea'); temp.value = value;
      document.body.append(temp); temp.select();
      const copied = document.execCommand('copy'); temp.remove();
      if (!copied) throw new Error('Copy unavailable');
    }
    status.textContent = 'Copied to clipboard.';
  } catch { status.textContent = 'Select the text and copy it using your keyboard.'; }
}

document.querySelectorAll('[data-copy-bio]').forEach(button => {
  button.addEventListener('click', () => copyText(document.querySelector('#speaker-bio').textContent.trim(), document.querySelector('#bio-status')));
});

document.querySelectorAll('[data-archive]').forEach(archive => {
  const search = archive.querySelector('input[type="search"]');
  let selected = 'all';
  const rows = [...archive.querySelectorAll('[data-item]')];
  const apply = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const show = (selected === 'all' || row.dataset.kind === selected) && row.textContent.toLocaleLowerCase().includes(query);
      row.hidden = !show; if (show) visible++;
    });
    archive.querySelector('.empty-state').hidden = visible !== 0;
    archive.querySelector('.archive-count').textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}`;
  };
  search.addEventListener('input', apply);
  archive.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      selected = button.dataset.filter;
      archive.querySelectorAll('[data-filter]').forEach(item => {
        const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active));
      });
      apply();
    });
  });
  apply();
});

const contact = document.querySelector('#contact-form');
if (contact) {
  const requested = new URLSearchParams(location.search).get('request');
  if ([...document.querySelector('#request').options].some(option => option.value === requested)) {
    document.querySelector('#request').value = requested;
  }
  const output = document.querySelector('#form-output');
  const preview = document.querySelector('#email-preview');
  const open = document.querySelector('#open-email');
  const status = document.querySelector('#form-status');
  let draft = '';
  contact.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contact);
    const subject = `${data.get('request')} · ${data.get('organization') || data.get('name')}`;
    draft = `Hello Mathilde,\n\n${data.get('message')}\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nOrganization or outlet: ${data.get('organization') || 'Not specified'}\nRequest type: ${data.get('request')}`;
    preview.value = draft;
    open.href = `mailto:${contact.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
    output.hidden = false;
    status.textContent = 'Your draft is ready. Open your email app or copy the text to send it. No message has been sent.';
    output.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest'});
  });
  document.querySelector('#copy-request').addEventListener('click', () => copyText(draft, status));
}
