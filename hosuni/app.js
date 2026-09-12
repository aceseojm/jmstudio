const $ = selector => document.querySelector(selector);
const desktop = $('#desktop'), pet = $('#pet'), petFrame = $('#petFrame');
const statusText = $('#statusText'), heartLayer = $('#heartLayer'), speech = $('#speech');
const reminderSettings = $('#reminderSettings'), settingsToggle = $('#settingsToggle');

const folder = { idle:'idle', follow:'mouse-follow', typing:'typing-tired', greeting:'greeting-wave', complete:'completion-jump', busy:'busy-work', reminder:'smart-reminder', sleep:'sleep-recovery' };
const frames = Object.fromEntries(Object.entries(folder).map(([state, dir]) => [state, [1,2,3,4].map(n => `assets/${dir}/frame-${String(n).padStart(2,'0')}.png`)]));
const breakFrames=['assets/break-stretch/frame-01.png'];
const thinkingFrames=['assets/focus-thinking/frame-01.png'];
const i18n = {
  ko:{intro:'마우스와 타이핑에 반응하고, 정해둔 시간에는 물·휴식·점심을 다정하게 알려주는 데스크톱 친구예요.',statuses:{idle:'쉬고 있어요',follow:'마우스를 따라가는 중 ♥',typing:'같이 타이핑하는 중',greeting:'반가워요!',complete:'오늘 할 일 완료!',busy:'집중해서 작업하는 중',reminder:'건강 알림을 전하는 중',sleep:'충전하며 자는 중'},reset:'호순이 돌아오기',settingsOpen:'알림 시간 설정',settingsClose:'알림 설정 접기',actions:['쉬기','따라가기','타이핑','인사','완료','집중','알림','잠들기'],character:'호순이 선택',pink:'핑크 호순이',orange:'주황 호순이',language:'언어',nickname:'사용자 닉네임',nicknamePlaceholder:'예: 정민',waterLabel:'물 알림(분)',breakLabel:'휴식 알림(분)',lunchLabel:'점심시간',scheduleTimeLabel:'일정 시간',scheduleTextLabel:'일정 내용',schedulePlaceholder:'예: 앤드류 미팅',previewLabel:'알림 미리보기',previews:['💧 물 알림 보기','🌿 휴식 알림 보기','🍱 점심 알림 보기','📅 일정 알림 보기'],save:'설정 저장',saved:'저장 완료 ✓',water:'물 마실 시간이야 💧',break:'잠깐 쉬는 시간이야 🌿',lunch:'점심시간이야! 맛있게 먹자 🍱',schedule:(time,text)=>`${time}에 ${text}이 있어요 📅`,variantSaved:v=>`${v}로 저장했어!`,petLabel:'핑크와 주황색 픽셀 호랑이 고양이'},
  en:{intro:'A desktop friend that responds to your mouse and typing, then gently reminds you to drink, rest, and eat lunch.',statuses:{idle:'Resting quietly',follow:'Following your mouse ♥',typing:'Typing with you',greeting:'Nice to see you!',complete:'Today’s task is complete!',busy:'Working with focus',reminder:'Sharing a healthy reminder',sleep:'Sleeping and recharging'},reset:'Bring Hosuni back',settingsOpen:'Reminder settings',settingsClose:'Hide settings',actions:['Rest','Follow','Type','Hello','Done','Focus','Reminder','Sleep'],character:'Choose Hosuni',pink:'Pink Hosuni',orange:'Orange Hosuni',language:'Language',nickname:'Your nickname',nicknamePlaceholder:'e.g. Jamie',waterLabel:'Water reminder (min)',breakLabel:'Break reminder (min)',lunchLabel:'Lunch time',scheduleTimeLabel:'Schedule time',scheduleTextLabel:'Schedule details',schedulePlaceholder:'e.g. Meeting with Andrew',previewLabel:'Reminder preview',previews:['💧 Preview water','🌿 Preview break','🍱 Preview lunch','📅 Preview schedule'],save:'Save settings',saved:'Saved ✓',water:'Time to drink some water 💧',break:'Time for a short break 🌿',lunch:'It’s lunchtime! Enjoy your meal 🍱',schedule:(time,text)=>`${text} is scheduled for ${time} 📅`,variantSaved:v=>`${v} has been saved!`,petLabel:'Pink and orange pixel tiger cat'},
  hi:{intro:'एक डेस्कटॉप दोस्त जो माउस और टाइपिंग पर प्रतिक्रिया देता है और पानी, आराम व दोपहर के भोजन की याद दिलाता है।',statuses:{idle:'शांत बैठी है',follow:'माउस के पीछे चल रही है ♥',typing:'आपके साथ टाइप कर रही है',greeting:'आपसे मिलकर खुशी हुई!',complete:'आज का काम पूरा हुआ!',busy:'ध्यान से काम कर रही है',reminder:'स्वास्थ्य की याद दिला रही है',sleep:'सोकर ऊर्जा भर रही है'},reset:'होसुनी को वापस लाएँ',settingsOpen:'रिमाइंडर सेटिंग',settingsClose:'सेटिंग छिपाएँ',actions:['आराम','पीछे आए','टाइपिंग','नमस्ते','पूरा','फोकस','रिमाइंडर','सोना'],character:'होसुनी चुनें',pink:'गुलाबी होसुनी',orange:'नारंगी होसुनी',language:'भाषा',nickname:'आपका नाम',nicknamePlaceholder:'जैसे: आरव',waterLabel:'पानी रिमाइंडर (मिनट)',breakLabel:'आराम रिमाइंडर (मिनट)',lunchLabel:'दोपहर का समय',scheduleTimeLabel:'कार्यक्रम का समय',scheduleTextLabel:'कार्यक्रम विवरण',schedulePlaceholder:'जैसे: एंड्रयू से मीटिंग',previewLabel:'रिमाइंडर पूर्वावलोकन',previews:['💧 पानी देखें','🌿 आराम देखें','🍱 भोजन देखें','📅 कार्यक्रम देखें'],save:'सेटिंग सहेजें',saved:'सहेजा गया ✓',water:'पानी पीने का समय है 💧',break:'थोड़ा आराम करने का समय है 🌿',lunch:'दोपहर के भोजन का समय है! 🍱',schedule:(time,text)=>`${time} बजे ${text} है 📅`,variantSaved:v=>`${v} सहेजी गई!`,petLabel:'गुलाबी और नारंगी पिक्सेल टाइगर कैट'},
  ja:{intro:'マウスやタイピングに反応し、水分補給・休憩・ランチの時間をやさしく知らせるデスクトップのお友達です。',statuses:{idle:'静かに休んでいます',follow:'マウスを追いかけています ♥',typing:'一緒にタイピング中',greeting:'会えてうれしいです！',complete:'今日のタスク完了！',busy:'集中して作業中',reminder:'健康リマインダーをお知らせ中',sleep:'眠って充電中'},reset:'ホスニを戻す',settingsOpen:'リマインダー設定',settingsClose:'設定を閉じる',actions:['休む','ついてくる','タイピング','あいさつ','完了','集中','通知','眠る'],character:'ホスニを選択',pink:'ピンクのホスニ',orange:'オレンジのホスニ',language:'言語',nickname:'ニックネーム',nicknamePlaceholder:'例：ミナ',waterLabel:'水分通知（分）',breakLabel:'休憩通知（分）',lunchLabel:'ランチ時間',scheduleTimeLabel:'予定時刻',scheduleTextLabel:'予定内容',schedulePlaceholder:'例：アンドリューと会議',previewLabel:'通知プレビュー',previews:['💧 水分通知','🌿 休憩通知','🍱 ランチ通知','📅 予定通知'],save:'設定を保存',saved:'保存しました ✓',water:'お水を飲む時間です 💧',break:'少し休憩しましょう 🌿',lunch:'ランチの時間です！ 🍱',schedule:(time,text)=>`${time}に「${text}」の予定があります 📅`,variantSaved:v=>`${v}で保存しました！`,petLabel:'ピンクとオレンジのピクセルタイガーキャット'}
};
const pwaI18n={
  ko:{install:'앱 설치',download:'배포판 다운로드',installed:'앱으로 설치됨',notify:'알림 허용',notifyOn:'알림 허용됨',notifyOff:'알림 차단됨',notifyNA:'알림 미지원'},
  en:{install:'Install app',download:'Download package',installed:'Installed as an app',notify:'Enable alerts',notifyOn:'Alerts enabled',notifyOff:'Alerts blocked',notifyNA:'Alerts unavailable'},
  hi:{install:'ऐप इंस्टॉल करें',download:'पैकेज डाउनलोड करें',installed:'ऐप इंस्टॉल है',notify:'सूचनाएँ चालू करें',notifyOn:'सूचनाएँ चालू हैं',notifyOff:'सूचनाएँ बंद हैं',notifyNA:'सूचनाएँ उपलब्ध नहीं'},
  ja:{install:'アプリをインストール',download:'配布版をダウンロード',installed:'アプリとしてインストール済み',notify:'通知を許可',notifyOn:'通知を許可済み',notifyOff:'通知が拒否されました',notifyNA:'通知に非対応'}
};
const temporary = new Set(['greeting','complete','busy','reminder','sleep']);

let state='idle', frameIndex=0, typingPawPhase=0, sleepSettled=false, sleepBreathTick=0, target={x:innerWidth*.72,y:innerHeight*.72}, position={...target};
const AUTO_SLEEP_DELAY=2*60*1000;
let lastActivityAt=performance.now(), lastPointerAt=-Infinity, lastKeyAt=-Infinity, typingHeat=0, heartTrail=true, lastHeartAt=0, manualUntil=0, speechTimer;
let facing=1;
const config = { language:'ko', characterVariant:'orange', nickname:'', waterMinutes:60, breakMinutes:50, lunchTime:'12:00', scheduleTime:'19:00', scheduleText:'앤드류 미팅', ...JSON.parse(localStorage.getItem('pixelTigerCatReminders') || '{}') };
config.scheduleTime=config.scheduleTime||'19:00';config.scheduleText=(config.scheduleText||'').trim()||'앤드류 미팅';
const tr=()=>i18n[config.language]||i18n.ko;
const applyCharacterVariant=variant=>{config.characterVariant=variant==='pink'?'pink':'orange';pet.classList.toggle('variant-pink',config.characterVariant==='pink');const choice=document.querySelector(`input[name="characterVariant"][value="${config.characterVariant}"]`);if(choice)choice.checked=true;};
const applyLanguage=language=>{config.language=i18n[language]?language:'ko';const d=tr();document.documentElement.lang=config.language;$('#languageSelect').value=config.language;$('#introText').textContent=d.intro;$('#resetButton').textContent=d.reset;settingsToggle.textContent=reminderSettings.hidden?d.settingsOpen:d.settingsClose;$('#characterLegend').textContent=d.character;$('#pinkLabel').textContent=d.pink;$('#orangeLabel').textContent=d.orange;$('#languageLabel').textContent=d.language;$('#nicknameLabel').textContent=d.nickname;$('#waterLabel').textContent=d.waterLabel;$('#breakLabel').textContent=d.breakLabel;$('#lunchLabel').textContent=d.lunchLabel;$('#scheduleTimeLabel').textContent=d.scheduleTimeLabel;$('#scheduleTextLabel').textContent=d.scheduleTextLabel;$('#nickname').placeholder=d.nicknamePlaceholder;$('#scheduleText').placeholder=d.schedulePlaceholder;$('#reminderPreview').setAttribute('aria-label',d.previewLabel);$('#saveSettings').textContent=d.save;pet.setAttribute('aria-label',d.petLabel);document.querySelectorAll('[data-action]').forEach((b,i)=>b.textContent=d.actions[i]);document.querySelectorAll('[data-reminder-preview]').forEach((b,i)=>b.textContent=d.previews[i]);statusText.textContent=d.statuses[state];};
applyCharacterVariant(config.characterVariant);$('#nickname').value=config.nickname||'';$('#waterMinutes').value=config.waterMinutes; $('#breakMinutes').value=config.breakMinutes; $('#lunchTime').value=config.lunchTime; $('#scheduleTime').value=config.scheduleTime; $('#scheduleText').value=config.scheduleText;applyLanguage(config.language);
let nextWaterAt=Date.now()+config.waterMinutes*60000, nextBreakAt=Date.now()+config.breakMinutes*60000, lunchShownOn='', scheduleShownKey='';

function setState(next, duration=0) {
  if(next!==state){state=next;frameIndex=0;sleepSettled=false;sleepBreathTick=0;} if(duration) manualUntil=performance.now()+duration;
  if(state!=='idle')pet.classList.remove('blinking');
  pet.classList.toggle('moving',state==='follow'); pet.classList.toggle('typing',false);
  pet.classList.toggle('tired',false);
  pet.classList.toggle('thinking',state==='busy');
  statusText.textContent=tr().statuses[state];
  document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('active',b.dataset.action===state));
}
function placeSpeech(){const r=pet.getBoundingClientRect(),center=r.left+r.width/2;const safeLeft=Math.min(innerWidth-130,Math.max(innerWidth>700?560:120,center));speech.style.left=`${safeLeft}px`;speech.style.top=`${Math.max(90,r.top-5)}px`;}
function keepPetClearOfPanel(){const card=$('.product-card').getBoundingClientRect(),r=pet.getBoundingClientRect();const overlaps=r.left<card.right+24&&r.right>card.left-24&&r.top<card.bottom+24&&r.bottom>card.top-24;if(overlaps){const left=Math.min(innerWidth-r.width-20,card.right+32);position.x=left+r.width/2;pet.style.left=`${left}px`;}}
function showSpeech(message,duration=6000,kind=''){clearTimeout(speechTimer);speech.textContent=message;speech.hidden=false;pet.classList.remove('water-offer','lunch-celebrate','break-stretch');void pet.offsetWidth;pet.classList.toggle('water-offer',kind==='water');pet.classList.toggle('lunch-celebrate',kind==='lunch');pet.classList.toggle('break-stretch',kind==='break');setState('reminder',duration);keepPetClearOfPanel();placeSpeech();speechTimer=setTimeout(()=>{speech.hidden=true;pet.classList.remove('water-offer','lunch-celebrate','break-stretch');},duration);}
function spawnHeart(x,y){if(!heartTrail||performance.now()-lastHeartAt<115)return;lastHeartAt=performance.now();const h=document.createElement('span');h.className='heart';h.textContent='♥';h.style.left=`${x}px`;h.style.top=`${y}px`;h.style.fontSize=`${9+Math.random()*6}px`;heartLayer.appendChild(h);h.addEventListener('animationend',()=>h.remove(),{once:true});}

desktop.addEventListener('pointermove',e=>{lastActivityAt=performance.now();if(e.target.closest('.product-card'))return;target={x:e.clientX,y:e.clientY};lastPointerAt=lastActivityAt;});
window.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;manualUntil=0;lastActivityAt=performance.now();lastKeyAt=lastActivityAt;typingHeat=Math.min(100,typingHeat+5);typingPawPhase=typingPawPhase===0?1:0;setState('typing');petFrame.src=frames.typing[typingPawPhase];});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.action;setState(action,temporary.has(action)?5200:0);if(action==='reminder')showSpeech(tr().water,6000,'water');}));
$('#heartToggle').addEventListener('click',e=>{heartTrail=!heartTrail;e.currentTarget.setAttribute('aria-pressed',String(heartTrail));e.currentTarget.textContent=`♥ Heart Trail ${heartTrail?'ON':'OFF'}`;});
$('#resetButton').addEventListener('click',()=>{typingHeat=0;position={x:innerWidth*.72,y:innerHeight*.72};target={...position};pet.style.left=`${position.x-pet.getBoundingClientRect().width/2}px`;pet.style.top=`${position.y-pet.getBoundingClientRect().height/2}px`;setState('idle');keepPetClearOfPanel();});
settingsToggle.addEventListener('click',()=>{reminderSettings.hidden=!reminderSettings.hidden;settingsToggle.setAttribute('aria-expanded',String(!reminderSettings.hidden));settingsToggle.textContent=reminderSettings.hidden?tr().settingsOpen:tr().settingsClose;if(!reminderSettings.hidden)keepPetClearOfPanel();});
document.querySelectorAll('input[name="characterVariant"]').forEach(input=>input.addEventListener('change',()=>applyCharacterVariant(input.value)));
$('#languageSelect').addEventListener('change',e=>{applyLanguage(e.target.value);updatePwaControls();});
const nicknamePrefix=()=>{const name=($('#nickname').value||config.nickname||'').trim();if(!name)return '';return config.language==='ko'?`${name}님, `:config.language==='ja'?`${name}さん、`:`${name}, `;};
reminderSettings.addEventListener('submit',e=>{e.preventDefault();config.language=$('#languageSelect').value;config.characterVariant=document.querySelector('input[name="characterVariant"]:checked')?.value||'orange';config.nickname=$('#nickname').value.trim();config.waterMinutes=Number($('#waterMinutes').value);config.breakMinutes=Number($('#breakMinutes').value);config.lunchTime=$('#lunchTime').value;config.scheduleTime=$('#scheduleTime').value;config.scheduleText=$('#scheduleText').value.trim()||tr().schedulePlaceholder;localStorage.setItem('pixelTigerCatReminders',JSON.stringify(config));nextWaterAt=Date.now()+config.waterMinutes*60000;nextBreakAt=Date.now()+config.breakMinutes*60000;const variant=config.characterVariant==='pink'?tr().pink:tr().orange;showSpeech(`${nicknamePrefix()}${tr().variantSaved(variant)}`);const saveButton=e.currentTarget.querySelector('button[type="submit"]');saveButton.textContent=tr().saved;setTimeout(()=>saveButton.textContent=tr().save,1600);});
const scheduleMessage=()=>`${nicknamePrefix()}${tr().schedule($('#scheduleTime').value||config.scheduleTime,$('#scheduleText').value.trim()||config.scheduleText)}`;
const reminderMessages={water:()=>`${nicknamePrefix()}${tr().water}`,break:()=>`${nicknamePrefix()}${tr().break}`,lunch:()=>`${nicknamePrefix()}${tr().lunch}`,schedule:scheduleMessage};
document.querySelectorAll('[data-reminder-preview]').forEach(button=>button.addEventListener('click',()=>{const kind=button.dataset.reminderPreview;showSpeech(reminderMessages[kind](),6000,kind);}));

let deferredInstallPrompt=null;
const installButton=$('#installApp'),notificationButton=$('#notificationPermission'),installStatus=$('#installStatus');
const pwaTr=()=>pwaI18n[config.language]||pwaI18n.ko;
function isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
function updatePwaControls(){const d=pwaTr();installButton.textContent=d.install;$('#downloadApp').textContent=d.download;installButton.hidden=isStandalone()||!deferredInstallPrompt;installStatus.textContent=isStandalone()?d.installed:'';if(!('Notification' in window)){notificationButton.textContent=d.notifyNA;notificationButton.disabled=true;}else{notificationButton.textContent=Notification.permission==='granted'?d.notifyOn:Notification.permission==='denied'?d.notifyOff:d.notify;notificationButton.disabled=Notification.permission!=='default';}}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;updatePwaControls();});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updatePwaControls();});
installButton.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;updatePwaControls();});
notificationButton.addEventListener('click',async()=>{if(!('Notification' in window))return;await Notification.requestPermission();updatePwaControls();});
async function sendSystemNotification(message){if(!('Notification' in window)||Notification.permission!=='granted')return;const options={body:message,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'hosuni-reminder',renotify:true};if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.ready;registration.showNotification('호순이',options);}else new Notification('호순이',options);}
function announceReminder(message,kind=''){showSpeech(message,6000,kind);sendSystemNotification(message);}
updatePwaControls();

setInterval(()=>{
  const activeFrames=state==='reminder'&&pet.classList.contains('lunch-celebrate')?frames.complete:state==='reminder'&&pet.classList.contains('break-stretch')?breakFrames:state==='busy'?thinkingFrames:frames[state];
  if(state==='idle'){
    frameIndex=0;
  }else if(state==='typing'){
    frameIndex=typingPawPhase;
  }else if(state==='sleep'){
    if(!sleepSettled){frameIndex=Math.min(frameIndex+1,3);sleepSettled=frameIndex===3;}
    else if(++sleepBreathTick%5===0) frameIndex=frameIndex===2?3:2;
  }else frameIndex=(frameIndex+1)%activeFrames.length;
  petFrame.src=activeFrames[frameIndex];
},165);
function blinkLoop(){
  if(state==='idle'){
    pet.classList.add('blinking');
    setTimeout(()=>pet.classList.remove('blinking'),150);
  }
  setTimeout(blinkLoop,2600+Math.random()*2400);
}
setTimeout(blinkLoop,1800);
setInterval(()=>{const now=new Date(),today=now.toLocaleDateString('sv-SE'),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,scheduleKey=`${today}-${config.scheduleTime}`;if(Date.now()>=nextWaterAt){announceReminder(`${nicknamePrefix()}${tr().water}`,'water');nextWaterAt=Date.now()+config.waterMinutes*60000;}else if(Date.now()>=nextBreakAt){announceReminder(`${nicknamePrefix()}${tr().break}`,'break');nextBreakAt=Date.now()+config.breakMinutes*60000;}else if(time===config.lunchTime&&lunchShownOn!==today){announceReminder(`${nicknamePrefix()}${tr().lunch}`,'lunch');lunchShownOn=today;}else if(time===config.scheduleTime&&scheduleShownKey!==scheduleKey){announceReminder(`${nicknamePrefix()}${tr().schedule(config.scheduleTime,config.scheduleText)}`);scheduleShownKey=scheduleKey;}},15000);

function tick(now){const manual=now<manualUntil,dx=target.x-position.x,dy=target.y-position.y,distance=Math.hypot(dx,dy);if(!manual){if(now-lastKeyAt<1600)setState('typing');else if(now-lastPointerAt<1500&&distance>96)setState('follow');else if(now-lastActivityAt>=AUTO_SLEEP_DELAY)setState('sleep');else setState('idle');}if(state==='follow'){const ease=Math.min(.052,.014+distance/16000);position.x+=dx*ease;position.y+=dy*ease;const size=pet.getBoundingClientRect().width;pet.style.left=`${Math.max(0,Math.min(innerWidth-size,position.x-size/2))}px`;pet.style.top=`${Math.max(170,Math.min(innerHeight-size,position.y-size/2))}px`;if(Math.abs(dx)>42)facing=dx<0?-1:1;pet.style.transform=`scaleX(${facing})`;spawnHeart(position.x-facing*58,position.y+45);}else pet.style.transform=`scaleX(${facing})`;keepPetClearOfPanel();typingHeat=Math.max(0,typingHeat-.012);if(!speech.hidden)placeSpeech();requestAnimationFrame(tick);}
setState('idle');keepPetClearOfPanel();requestAnimationFrame(tick);
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
