// The room is always ready on loopback. Wi-Fi sharing opens a separate listener.
const config=JSON.parse(process.argv[2]||'{}');
for(const key of ['PARTY_ADMIN_KEY','PARTY_DATA_FILE','PARTY_PORT_FILE'])if(config[key])process.env[key]=config[key];
process.env.PARTY_EMBEDDED='1';process.env.PARTY_NATIVE_PHYSICS='1';process.env.PARTY_NO_BROWSER='1';process.env.PARTY_PORT='8080';
global.__partyReportProgress=process._linkedBinding('localparty_runtime').reportProgress;
require('./server.js');
