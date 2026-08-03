// Local, rule-based Judge engine — produces courtroom verdicts from the user's
// actual contracts, charges, and warrants without calling any LLM, so it costs
// zero integration credits. Behaviour follows the fair/cruel (extreme_mode)
// setting on UserSettings, mirroring the original Judge agent instructions.

import { buildChargeRecord } from './albertaCriminalCode';

function parseIntent(msg) {
  const m = (msg || '').toLowerCase();
  if (/dismiss|acquit|throw out|vacate|drop the charges|not guilty|innocent|clear my name|clear me/.test(m)) return 'dismiss';
  if (/guilty|admit|confess|i did it|i accept responsibility|plead guilty|i plead/.test(m)) return 'guilty';
  if (/mercy|lenienc|forgive|second chance|reduce|lower|less|lighter|compassion|please help/.test(m)) return 'mercy';
  if (/what are my charges|status|what am i charged|list my|charges do i have|what did i do|what am i facing/.test(m)) return 'status';
  if (/warrant|arrest|bail|turn myself|surrender/.test(m)) return 'warrant';
  return 'plea';
}

export function generateVerdict({ message, settings, contracts, records, warrants, notifications }) {
  const extreme = !!settings?.extreme_mode;
  const accepted = (contracts || []).filter(c => c.is_accepted);
  const allRecords = records || [];
  const activeWarrants = (warrants || []).filter(w => w.status === 'active');
  const pending = (notifications || []).filter(n => n.type === 'criminal_charge' && !n.charges_dismissed);

  const intent = parseIntent(message);
  const actions = { dismissNotificationIds: [], newChargeKeys: [], resolveWarrantIds: [] };

  const lines = [];
  lines.push('**IN THE ALBERTA COURT OF JUSTICE**');
  lines.push('');
  lines.push(extreme
    ? '_Proceeding in Cruel Mode — the Court shows no mercy._'
    : '_Proceeding in Fair Mode — the Court applies the law impartially._');
  lines.push('');

  lines.push('### Review of the Record');
  if (accepted.length) {
    lines.push(`The Court has reviewed ${accepted.length} binding contract(s) on file, ${allRecords.length} criminal charge(s), and ${activeWarrants.length} active warrant(s).`);
  } else {
    lines.push('The Court finds no binding contracts on file.');
  }
  if (pending.length) {
    lines.push(`There ${pending.length === 1 ? 'is 1 pending matter' : `are ${pending.length} pending matters`} before the Court.`);
  }
  lines.push('');

  if (intent === 'status') {
    lines.push('### Charges Before the Court');
    if (allRecords.length === 0) {
      lines.push('No criminal charges are currently on record.');
    } else {
      allRecords.slice(0, 8).forEach((r, i) => {
        lines.push(`${i + 1}. **${r.charge}**${r.code_reference ? ` — ${r.code_reference}` : ''}${r.offence_type ? ` (${r.offence_type})` : ''}${r.max_penalty ? ` · Max: ${r.max_penalty}` : ''}`);
      });
      if (allRecords.length > 8) lines.push(`_…and ${allRecords.length - 8} more._`);
    }
  } else if (intent === 'dismiss') {
    if (extreme) {
      lines.push('### Ruling');
      lines.push('The defendant moves to dismiss. **DENIED.**');
      lines.push('No charge shall be dismissed in this Court. The defendant signed each contract willingly and is bound by its literal terms. The motion is frivolous and is treated as a further obstruction of justice.');
      actions.newChargeKeys.push('obstruction_of_justice');
    } else {
      const dismissable = allRecords.filter(r => r.severity === 'misdemeanor' || r.offence_type === 'summary');
      if (dismissable.length) {
        lines.push('### Ruling');
        lines.push('The defendant presents grounds for dismissal. The Court reviews the record and finds the lesser charges lack sufficient grounds to proceed.');
        lines.push('**GRANTED in part.** The following lesser matters are dismissed:');
        dismissable.slice(0, 3).forEach(r => lines.push(`- ${r.charge}${r.code_reference ? ` (${r.code_reference})` : ''}`));
        pending.slice(0, 1).forEach(n => actions.dismissNotificationIds.push(n.id));
        lines.push('');
        lines.push('The remaining serious charges stand. The defendant is warned that further breaches will not be treated so leniently.');
      } else {
        lines.push('### Ruling');
        lines.push('The defendant moves to dismiss. The Court has reviewed the record. No grounds sufficient to dismiss have been established; however, no additional penalty is imposed at this time.');
        lines.push('**Motion DENIED.** The charges remain on the record.');
      }
    }
  } else if (intent === 'guilty') {
    if (extreme) {
      lines.push('### Ruling');
      lines.push('The defendant pleads guilty. The Court accepts the plea and imposes the **maximum sentence** on every charge.');
      lines.push('No mitigation. No mercy. Each charge carries its full maximum penalty, and the Court adds a further charge for the waste of judicial resources.');
      actions.newChargeKeys.push('contempt_of_court');
    } else {
      lines.push('### Ruling');
      lines.push('The defendant pleads guilty. A guilty plea is a mitigating factor. The Court accepts the plea and imposes a **reduced, proportionate sentence**.');
      lines.push('The defendant is ordered to comply with all contract terms and attend all scheduled court dates. Failure to do so will restore the full penalties.');
    }
  } else if (intent === 'mercy') {
    if (extreme) {
      lines.push('### Ruling');
      lines.push('The defendant begs for mercy. **There is no mercy in this Court.**');
      lines.push('The request is denied. The sentence stands at maximum. The defendant is reminded that they bound themselves to these terms by signature.');
    } else {
      lines.push('### Ruling');
      lines.push('The defendant requests leniency. The Court considers the circumstances and **reduces the outstanding penalties by half** where the law permits.');
      lines.push('This leniency is conditional on full compliance with all contract terms and court dates. Any breach reinstates the full penalties.');
    }
  } else if (intent === 'warrant') {
    if (activeWarrants.length) {
      lines.push('### Outstanding Warrants');
      activeWarrants.forEach(w => lines.push(`- **Active warrant:** ${w.reason}`));
      if (extreme) {
        lines.push('The warrants remain active. The defendant is to be apprehended immediately. No bail.');
      } else {
        lines.push('The Court advises the defendant to surrender voluntarily. A voluntary surrender may be considered at a bail hearing.');
      }
    } else {
      lines.push('### Warrants');
      lines.push('There are no active warrants on file.');
    }
  } else {
    lines.push('### Ruling');
    if (extreme) {
      lines.push('The defendant stands before the Court. The charges are valid. The contracts are binding. The sentence is the **maximum permitted by law**.');
      lines.push('The defendant is reminded that they signed each obligation willingly. The Court takes no pleasure in leniency — because there is none.');
      if (pending.length) actions.newChargeKeys.push('failure_to_comply');
    } else {
      lines.push('The Court has heard the defendant. The charges and contracts are reviewed. The defendant is ordered to comply with all terms and attend all scheduled appearances.');
      lines.push('Should the defendant maintain compliance, the Court may consider further leniency at a future hearing.');
    }
  }

  lines.push('');
  lines.push('_So ordered. — The Court_');
  return { verdict: lines.join('\n'), actions };
}