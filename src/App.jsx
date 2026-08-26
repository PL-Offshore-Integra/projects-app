import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://integra.ploffshore.com";
const EMPRESAS = ["Parana Logistica", "Clean Sea", "Terra Mare"];
const USUARIO = "Gerencia";

//  CATÁLOGOS COMPRAS (espejo de compras-app) 
const BASES_POR_EMPRESA = {
  "Parana Logistica": ["Atlantic Dama", "Golondrina de Mar", "Base Zárate", "Base Buenos Aires"],
  "Clean Sea": ["Clean Sea 1", "Clean Sea 2", "Base Dock Sud"],
  "Terra Mare": ["Oficina Central", "Base Zárate"],
};
const URGENCIA_OPTIONS = ["Normal", "Alta", "Critica"];
const SUBAREA_TECNICA = {
  "Parana Logistica": ["Motores", "Cubierta", "Electricidad", "Navegación", "Seguridad", "Casco", "Habitabilidad", "Otro"],
  "Clean Sea": ["Equipos", "Cubierta", "Electricidad", "Seguridad", "Otro"],
  "Terra Mare": ["Oficina", "Equipos", "Mantenimiento", "Otro"],
};
// FIX A6: estos valores deben coincidir con TIPOS_REQUISICION en compras-app/src/lib/catalogos.js
const TIPOS_REQUISICION_PROJECTS = ["Bienes", "Servicios", "Mixto"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/*  TOKENS · INTEGRA Brand Book v1.0 
   Los nombres de variable son los que ya usaba esta app: cambian los valores,
   no los selectores. Navy = estructura, nunca acción. Un solo color de acción.
    */
:root{
  --navy:#082F4E;--blue:#056D76;--mid:#4A5560;--light:#C9D0D6;
  --bg:#FAFBFC;--surface:#FFFFFF;--surface2:#F4F6F8;--surface3:#E4E8EC;
  --border:#E4E8EC;--border2:#C9D0D6;
  --text:#0F1419;--muted:#4A5560;--muted2:#7A8792;
  --accent:#056D76;--accent2:#0E7A5F;--warn:#8F5A0B;--danger:#B3261E;
  --purple:#4A5560;--teal:#056D76;--orange:#8F5A0B;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;--r:4px;--r2:4px;
  --nav:#082F4E;--action:#056D76;--action-press:#04565D;
  --tr:color 120ms cubic-bezier(.2,0,.38,.9),background-color 120ms cubic-bezier(.2,0,.38,.9),border-color 120ms cubic-bezier(.2,0,.38,.9);
}
/* Instancia: se activa con <html data-instance="pl-offshore"> en index.html */
[data-instance="pl-offshore"]{--nav:#002247;--action:#002247;--blue:#002247;--accent:#002247}
[data-instance="clean-sea"]{--nav:#1B3765;--action:#006945;--blue:#006945;--accent:#006945}
[data-instance="terramare"]{--nav:#213363;--action:#1F5285;--blue:#1F5285;--accent:#1F5285}

body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.55;min-height:100vh;overflow-x:hidden}
*:focus-visible{outline:2px solid var(--action);outline-offset:2px}
.app{display:flex;min-height:100vh;overflow-x:hidden}

/*  NAVEGACIÓN LATERAL · 240px, colapsa a iconos en mobile  */
.sidebar{width:240px;min-width:240px;background:var(--nav);display:flex;flex-direction:column}
.sidebar-header{border-bottom:1px solid rgba(255,255,255,.14)}
.sidebar-logo-wrap{padding:14px 16px;display:flex;align-items:center;gap:12px;height:56px}
.sidebar-logo-img{width:28px;height:28px;object-fit:contain;border-radius:var(--r);border:0;background:rgba(255,255,255,.14)}
.sidebar-logo-main{font-size:14px;font-weight:600;color:#fff;letter-spacing:0;text-transform:none}
.sidebar-logo-sub{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.72);margin-top:2px;letter-spacing:.06em;text-transform:uppercase}
.nav-section{padding:16px 16px 6px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:rgba(255,255,255,.72);text-transform:uppercase}
.ni{display:flex;align-items:center;gap:10px;padding:9px 16px;font-size:14px;font-weight:500;cursor:pointer;color:rgba(255,255,255,.72);border-left:3px solid transparent;transition:var(--tr);user-select:none;min-height:36px}
.ni:hover{color:#fff;background:rgba(255,255,255,.08)}
.ni.active{color:#fff;border-left-color:var(--action);background:rgba(255,255,255,.12);font-weight:500}
.ni.sub{padding-left:34px;font-size:13px;font-weight:400}
.ni.sub.active{font-weight:500}
.ni.back{color:rgba(255,255,255,.72);font-size:13px;border-top:1px solid rgba(255,255,255,.14);margin-top:6px}
.ni.back:hover{color:#fff}
.ni-icon{font-size:14px;width:16px;text-align:center;flex-shrink:0}
.ni-badge{margin-left:auto;background:rgba(255,255,255,.14);color:#fff;font-family:var(--mono);font-size:11px;font-weight:500;padding:2px 7px;border-radius:3px;min-width:20px;text-align:center}
.ni-badge.amber{background:rgba(255,255,255,.14)}
.ni-badge.gray{background:rgba(255,255,255,.14);color:rgba(255,255,255,.72)}

/*  BARRA SUPERIOR · 56px  */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
.topbar-title{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.content{flex:1;overflow-y:auto;overflow-x:hidden;padding:24px;background:var(--bg)}

/*  PANELES · blancos, borde 1px, radio 4, sin sombra  */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:24px;margin-bottom:16px}
.card-title{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}

/*  KPIs  */
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:24px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px}
.stat-label{font-family:var(--mono);font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.08em;margin-bottom:8px;text-transform:uppercase}
.stat-value{font-family:var(--mono);font-size:30px;font-weight:600;color:var(--navy);font-variant-numeric:tabular-nums}
.va{color:var(--navy)}.vg{color:var(--accent2)}.vr{color:var(--danger)}.vp{color:var(--muted)}.vm{color:var(--warn)}.vgr{color:var(--muted)}

/*  TABLAS · fila 40px, regla marcada de 2px navy, dato en mono  */
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:2px solid var(--navy);white-space:nowrap;background:var(--surface)}
td{padding:12px;border-bottom:1px solid var(--border);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.click:hover td{background:var(--surface2);cursor:pointer}
.tracker-table th{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:2px solid var(--navy);white-space:nowrap;background:var(--surface);position:sticky;top:0;z-index:2}
.tracker-table th.sortable{cursor:pointer;user-select:none}
.tracker-table th.sortable:hover{color:var(--navy)}
.tracker-table td{padding:12px;border-bottom:1px solid var(--border);vertical-align:middle}
.tracker-table tr:hover td{background:var(--surface2);cursor:pointer}
.tracker-table tr:last-child td{border-bottom:none}

/*  FILTROS  */
.filter-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.filter-input,.filter-select{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--sans);font-size:14px;height:36px;padding:0 10px;outline:none;min-width:150px;transition:var(--tr)}
.filter-select{cursor:pointer}
.filter-input:focus,.filter-select:focus{border-width:2px;border-color:var(--action);padding:0 9px}

/*  BADGES DE ESTADO · fondo tenue, texto de estado, mono caja alta  */
.badge{display:inline-flex;align-items:center;font-family:var(--mono);font-size:11px;font-weight:500;padding:3px 8px;border-radius:3px;white-space:nowrap;letter-spacing:.06em;text-transform:uppercase}
.b-amber{background:#FBF1E3;color:#8F5A0B;border:0}
.b-blue{background:#E6F1F2;color:#056D76;border:0}
.b-teal{background:#E8F3EF;color:#0E7A5F;border:0}
.b-red{background:#FAEAE8;color:#B3261E;border:0}
.b-purple{background:#F4F6F8;color:#4A5560;border:0}
.b-orange{background:#FBF1E3;color:#8F5A0B;border:0}
.b-green{background:#E8F3EF;color:#0E7A5F;border:0}
.b-gray{background:#F4F6F8;color:#4A5560;border:0}
.urgdot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0}

/*  BOTONES · un solo primario por vista. Nada se mueve al presionar  */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-size:14px;font-weight:500;letter-spacing:0;height:36px;padding:0 16px;border-radius:var(--r);border:1px solid transparent;cursor:pointer;transition:var(--tr);white-space:nowrap;text-transform:none}
.btn-primary{background:var(--action);color:#fff}
.btn-primary:hover{background:var(--navy)}
.btn-primary:active{background:var(--action-press)}
.btn-success{background:var(--accent2);color:#fff}
.btn-success:hover{background:#0B6249}
.btn-danger{background:var(--surface);color:var(--danger);border-color:var(--border2)}
.btn-danger:hover{background:#FAEAE8;border-color:var(--danger)}
.btn-ghost{background:var(--surface);color:var(--muted);border-color:var(--border2)}
.btn-ghost:hover{color:var(--text);background:var(--surface2)}
.btn-warn{background:var(--surface);color:var(--warn);border-color:var(--border2)}
.btn-warn:hover{background:#FBF1E3;border-color:var(--warn)}
.btn-cond{background:var(--surface);color:var(--muted);border-color:var(--border2)}
.btn-cond:hover{background:var(--surface2)}
.btn-confirm{background:var(--surface);color:var(--warn);border-color:var(--border2)}
.btn-confirm:hover{background:#FBF1E3}
.btn-sm{height:28px;padding:0 12px;font-size:13px}
.btn:disabled{background:var(--surface3);color:var(--muted2);border-color:transparent;cursor:not-allowed}

/*  CAPAS FLOTANTES · la única sombra del sistema  */
.overlay{position:fixed;inset:0;background:rgba(15,20,25,.45);display:flex;align-items:flex-start;justify-content:center;z-index:100;padding:24px;overflow-y:auto}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);width:100%;max-width:860px;margin:auto;box-shadow:0 8px 24px rgba(15,20,25,.14)}
.modal-lg{max-width:1120px}
.mhdr{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:1px solid var(--border);background:var(--surface);border-radius:var(--r) var(--r) 0 0}
.mtitle{font-size:18px;font-weight:600;letter-spacing:0;color:var(--navy)}
.mbody{padding:24px}
.mftr{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;background:var(--surface2);border-radius:0 0 var(--r) var(--r)}
.mclose{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;transition:var(--tr)}
.mclose:hover{color:var(--navy)}
@keyframes fadeIn{from{opacity:1}to{opacity:1}}
@keyframes slideUp{from{opacity:1}to{opacity:1}}

/*  FORMULARIOS · campo 36px, foco borde 2px  */
.fg{display:flex;flex-direction:column;gap:6px}
.fg label{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:500}
.fg input,.fg select,.fg textarea{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--sans);font-size:14px;height:36px;padding:0 12px;outline:none;transition:var(--tr)}
.fg textarea{resize:vertical;min-height:72px;height:auto;padding:10px 12px}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-width:2px;border-color:var(--action);padding:0 11px}
.fg textarea:focus{padding:9px 11px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px}
.form-section{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.items-edit th{font-family:var(--mono);font-size:11px;background:var(--surface)}
.items-edit td{padding:6px 8px}
.items-edit input,.items-edit select{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--mono);font-size:13px;height:32px;padding:0 8px;width:100%;outline:none;transition:var(--tr)}
.items-edit input:focus,.items-edit select:focus{border-width:2px;border-color:var(--action);padding:0 7px}

/*  TRAZABILIDAD  */
.tl{list-style:none}
.tl-item{display:flex;gap:12px;padding-bottom:16px;position:relative}
.tl-item:not(:last-child)::before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:1px;background:var(--border)}
.tl-dot{width:24px;height:24px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;z-index:1}
.tl-dot.c{border-color:var(--action);color:var(--action);background:#E6F1F2}
.tl-dot.a{border-color:var(--accent2);color:var(--accent2);background:#E8F3EF}
.tl-dot.r{border-color:var(--danger);color:var(--danger);background:#FAEAE8}
.tl-dot.u{border-color:var(--warn);color:var(--warn);background:#FBF1E3}
.tl-ev{font-size:14px;font-weight:500;color:var(--navy)}
.tl-meta{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:4px}

/*  FILA DE REQUISICIÓN · el estado va en el borde izquierdo de 3px  */
.req-row{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;margin-bottom:12px;cursor:pointer;transition:var(--tr)}
.req-row:hover{border-color:var(--navy)}
.req-row.unread{border-left:3px solid var(--action)}
.req-row.devuelto{border-left:3px solid var(--warn)}
.req-row.pend-confirm{border-left:3px solid var(--warn)}
.req-title{font-weight:600;font-size:15px;margin-bottom:6px;color:var(--navy)}
.req-meta{display:flex;gap:16px;font-size:13px;color:var(--muted);flex-wrap:wrap;align-items:center}

/*  AVISOS  */
.notif{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border);border-left-width:3px;border-radius:var(--r);padding:14px 16px;font-size:14px;z-index:300;max-width:360px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(15,20,25,.14)}
.n-green{border-left-color:var(--accent2)}.n-red{border-left-color:var(--danger)}.n-amber{border-left-color:var(--warn)}.n-blue{border-left-color:var(--action)}
.info-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;font-size:14px}
.info-box.accent{border-left:3px solid var(--action)}
.info-box.warn{border-left:3px solid var(--warn)}
.info-box.danger{border-left:3px solid var(--danger)}
.info-box.orange{border-left:3px solid var(--warn)}

/*  UTILIDADES  */
.flex-gap{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.flex-between{display:flex;justify-content:space-between;align-items:center;gap:12px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.text-mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.text-muted{color:var(--muted)}
.empty-state{text-align:center;padding:48px 24px;color:var(--muted);font-size:15px}
.loading{display:flex;align-items:center;justify-content:center;padding:48px;color:var(--muted);gap:12px;font-size:15px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.kbar{margin-bottom:12px}
.kbar-lbl{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
.kbar-track{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;border:0}
.kbar-fill{height:100%;border-radius:3px}
.tabs-row{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:24px;overflow-x:auto}
.tab{font-size:14px;font-weight:500;padding:10px 16px;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;transition:var(--tr);text-transform:none;letter-spacing:0;margin-bottom:-1px;white-space:nowrap}
.tab:hover{color:var(--navy)}
.tab.active{color:var(--action);border-bottom-color:var(--action)}
.grupo-chip{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:3px;font-family:var(--mono);font-size:12px;font-weight:500;background:var(--surface2);color:var(--navy);border:1px solid var(--border);flex-shrink:0}
.tag{display:inline-block;font-family:var(--mono);font-size:11px;padding:3px 7px;background:var(--surface2);border:1px solid var(--border);border-radius:3px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.fecha-chip{display:inline-flex;flex-direction:column;gap:2px;font-family:var(--mono);font-size:11px;color:var(--text);white-space:nowrap;font-variant-numeric:tabular-nums}
.fecha-chip span:first-child{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.tracker-simple-row{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px}
.tracker-simple-row.en-curso{border-left:3px solid var(--warn)}
.tracker-simple-row.entregado{border-left:3px solid var(--accent2)}
.req-row-actions{display:flex;flex-direction:row;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);justify-content:flex-end}
.cotiz-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:16px}

/*  MOBILE  */
@media (max-width: 768px) {
  .app { flex-direction: column; }
  .sidebar { display: none; }
  .main { width: 100%; padding-bottom: 72px; }
  .topbar { padding: 0 16px; }
  .content { padding: 16px; }
  .card { padding: 16px; margin-bottom: 12px; }
  .stats { grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat { padding: 14px; }
  .stat-value { font-size: 24px; }
  .form-grid, .form-grid-3 { grid-template-columns: 1fr; gap: 12px; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { font-size: 13px; min-width: 540px; }
  th, td { padding: 10px 8px; }
  .tracker-table th, .tracker-table td { padding: 10px 8px; }
  .filter-row { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-select { min-width: unset; width: 100%; }
  .btn { height: 44px; padding: 0 14px; }
  .btn-sm { height: 36px; }
  .mftr { flex-wrap: wrap; gap: 8px; }
  .mftr .btn { flex: 1; justify-content: center; }
  .overlay { padding: 0; align-items: flex-end; }
  .modal { border-radius: var(--r) var(--r) 0 0; max-width: 100%; max-height: 92vh; overflow-y: auto; }
  .modal-lg { max-width: 100%; }
  .req-meta { gap: 10px; }
  .req-title { font-size: 15px; }
  .tabs-row { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tab { font-size: 13px; padding: 10px 12px; }
  .notif { bottom: 88px; right: 12px; left: 12px; max-width: unset; }
  .items-edit { font-size: 13px; }
  .items-edit th, .items-edit td { padding: 6px; }
  .items-edit table { min-width: 380px; }
  .req-row-actions{flex-direction:column;gap:8px;width:100%}
  .req-row-actions .btn{width:100%}
  .mftr{flex-direction:column;align-items:stretch;gap:8px}
  .mftr .btn{width:100%;flex:unset}
  .mftr .btn-success{order:-3}.mftr .btn-primary{order:-2}.mftr .btn-danger{order:-1}
  .card-title{flex-direction:column;align-items:flex-start;gap:10px}
  .card-title .btn{width:100%}
  .filter-row .btn{width:100%}
  .form-footer-actions{flex-direction:column !important;align-items:stretch !important}
  .form-footer-actions .btn{width:100%}
  .cotiz-grid{grid-template-columns:1fr !important}
  .req-row .flex-between{flex-direction:column;align-items:flex-start;gap:10px}
  .req-row .flex-between > .flex-gap:last-child{width:100%;flex-direction:column;gap:8px}
  .req-row .flex-between > .flex-gap:last-child .btn{width:100%}
}

/*  NAVEGACIÓN INFERIOR (solo mobile)  */
@media (max-width: 768px) {
  .mobile-nav {
    display: flex !important;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--nav); border-top: 1px solid rgba(255,255,255,.14);
    z-index: 50; height: 64px;
    justify-content: space-around; align-items: center;
    padding: 0 4px; overflow-x: auto;
  }
  .mobile-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    cursor: pointer; padding: 8px; border-radius: var(--r);
    color: rgba(255,255,255,.72); transition: var(--tr); flex: 1;
    position: relative; min-width: 48px; min-height: 48px; justify-content: center;
  }
  .mobile-nav-item.active { color: #fff; background: rgba(255,255,255,.12); }
  .mobile-nav-item:hover { color: #fff; }
  .mobile-nav-icon { font-size: 16px; line-height: 1; }
  .mobile-nav-label { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; text-align: center; }
  .mobile-nav-badge {
    position: absolute; top: 4px; right: 8px;
    background: rgba(255,255,255,.14); color: #fff;
    font-family: var(--mono); font-size: 10px; font-weight: 500;
    padding: 1px 5px; border-radius: 3px; min-width: 16px; text-align: center;
  }
  .mobile-nav-badge.amber { background: rgba(255,255,255,.14); }
  .mobile-nav-badge.gray { background: rgba(255,255,255,.14); }
}
@media (min-width: 769px) {
  .mobile-nav { display: none !important; }
}

/*  ARMAZÓN · shell del prototipo 
   La navegación del módulo es BLANCA con borde derecho; el navy es la barra
   superior. El ítem activo lleva borde izquierdo de 3px en el color de acción.
    */
.shell{display:grid;grid-template-columns:248px minmax(0,1fr);align-items:stretch;min-height:100vh}
.shell.is-collapsed{grid-template-columns:68px minmax(0,1fr)}

.appbar{height:56px;background:var(--nav);display:flex;align-items:center;gap:24px;padding:0 24px;flex:0 0 auto}
.appbar-iso{height:26px;width:auto;object-fit:contain;display:block;flex:0 0 auto}
.appbar-div{width:1px;height:24px;background:rgba(255,255,255,.14);flex:0 0 auto}
.appbar-instance{font:500 14px/1.2 var(--sans);color:#fff;white-space:nowrap;flex:0 0 auto}
.appbar-search{flex:1;max-width:380px;display:flex;align-items:center;gap:10px;height:32px;padding:0 12px;background:rgba(255,255,255,.10);border:0;border-radius:var(--r);font:400 14px/1.2 var(--sans);color:rgba(255,255,255,.72)}
.appbar-search::placeholder{color:rgba(255,255,255,.72)}
.appbar-tools{margin-left:auto;display:flex;align-items:center;gap:16px}
.appbar-avatar{width:28px;height:28px;border-radius:var(--r);background:rgba(255,255,255,.14);color:#fff;font-family:var(--mono);font-size:12px;font-weight:500;line-height:28px;text-align:center;flex:0 0 auto}
.appbar-user{font:500 13px/1.25 var(--sans);color:#fff;white-space:nowrap}
.appbar-link{background:none;border:0;padding:0;cursor:pointer;font:500 13px/1.2 var(--sans);color:rgba(255,255,255,.86);white-space:nowrap}
.appbar-link:hover{color:#fff;text-decoration:underline}

.sidebar{width:auto;min-width:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column}
.sidebar-header{border-bottom:1px solid var(--border);padding:16px;display:flex;align-items:center;gap:12px;min-height:69px}
.sidebar-logo-img{width:32px;height:32px;object-fit:contain;border:0;border-radius:0;background:none;flex:0 0 auto}
.sidebar-logo-main{font:600 15px/1.3 var(--sans);color:var(--navy);letter-spacing:0;text-transform:none}
.sidebar-logo-sub{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-top:2px}
.sidebar-nav{flex:1;padding:12px 0;overflow-y:auto}
.nav-section{padding:14px 16px 8px;font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;text-align:left}
.ni{display:flex;align-items:center;gap:12px;width:100%;padding:9px 16px 9px 13px;background:transparent;border:0;border-left:3px solid transparent;cursor:pointer;text-align:left;font:400 14px/1.3 var(--sans);color:var(--muted);transition:var(--tr);min-height:38px}
.ni:hover{background:var(--surface2);color:var(--navy)}
.ni.active{background:var(--surface2);border-left-color:var(--action);color:var(--navy);font-weight:500}
.ni-ico{display:block;flex:0 0 auto;color:var(--muted2)}
.ni.active .ni-ico{color:var(--action)}
.ni-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ni-badge{margin-left:auto;font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);background:var(--surface2);padding:3px 6px;border-radius:3px;min-width:22px;text-align:center;border:1px solid var(--border)}
.ni.active .ni-badge{color:var(--action);background:var(--surface);border-color:var(--border2)}
.ni-badge.amber{color:var(--warn)}
.ni-badge.gray{color:var(--muted)}
.sidebar-foot{border-top:1px solid var(--border);padding:12px 8px;display:flex;flex-direction:column;gap:2px}
.sidebar-foot-btn{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;background:none;border:0;border-radius:var(--r);cursor:pointer;font:500 13px/1.2 var(--sans);color:var(--muted);transition:var(--tr)}
.sidebar-foot-btn:hover{background:var(--surface2);color:var(--navy)}
.sidebar-foot-meta{padding:8px 10px 0;font-family:var(--mono);font-size:11px;font-weight:500;line-height:1.6;letter-spacing:.06em;color:var(--muted2)}
.shell.is-collapsed .sidebar-header{justify-content:center;padding:16px 8px}
.shell.is-collapsed .ni{justify-content:center;padding:9px 8px 9px 5px}
.shell.is-collapsed .sidebar-foot-btn{justify-content:center}

/*  encabezado de pantalla  */
.pagehead{background:var(--surface);border-bottom:1px solid var(--border);padding:16px 24px;flex:0 0 auto}
.crumb{display:flex;align-items:center;gap:8px;font:400 13px/1.2 var(--sans);color:var(--muted)}
.crumb button{background:none;border:0;padding:0;cursor:pointer;font:400 13px/1.2 var(--sans);color:var(--action)}
.crumb button:hover{text-decoration:underline;color:var(--navy)}
.crumb-current{color:var(--text)}
.pagehead-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-top:10px}
.pagehead h1{font:600 24px/1.25 var(--sans);color:var(--navy);margin:0}
.pagehead p{font:400 13px/1.45 var(--sans);color:var(--muted);margin:6px 0 0;max-width:70ch}
.pagehead-actions{display:flex;gap:8px;flex:0 0 auto}

@media (max-width:768px){
  .shell,.shell.is-collapsed{grid-template-columns:1fr}
  .sidebar{display:none}
  .appbar{gap:12px;padding:0 16px}
  .appbar-search,.appbar-instance{display:none}
  .pagehead{padding:14px 16px}
  .pagehead-row{flex-direction:column;align-items:stretch;gap:12px}
  .pagehead-actions .btn{flex:1}
  .main{padding-bottom:72px}
}


/*  GANTT · grilla de tiempo  */
.gantt-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.gantt-scroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}
.gantt-inner{width:max-content;min-width:100%}
.gantt-header{display:grid;background:var(--surface2);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:2}
.gh-cell{font-family:var(--mono);font-size:10px;font-weight:500;letter-spacing:.03em;color:var(--muted);text-transform:uppercase;padding:7px 2px;text-align:center;white-space:nowrap;overflow:hidden;border-right:1px solid var(--border)}
.gh-cell:last-child{border-right:0}
.gantt-row{display:grid;border-bottom:1px solid var(--border);background:var(--surface)}
.gantt-row:last-child{border-bottom:0}
.gantt-row:hover{filter:brightness(.98)}
.gc-label{padding:8px 10px;border-right:1px solid var(--border);min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center}
.gc-name{font-size:11px;font-weight:600;color:var(--navy);line-height:1.3;word-break:break-word;display:flex;align-items:center;gap:6px}
.gc-sub{font-family:var(--mono);font-size:9px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gc-bars{position:relative;min-height:44px;padding:14px 0;overflow:hidden}
.cc-badge{display:inline-block;font-family:var(--mono);font-size:8px;font-weight:600;line-height:1;letter-spacing:.06em;color:#fff;background:var(--danger);border-radius:2px;padding:2px 4px;flex-shrink:0}

/*  barras de tarea  */
.bar{position:absolute;top:12px;height:16px;border-radius:3px;min-width:3px}
.bar.normal{background:#9EB3C8}
.bar.critical{background:var(--danger)}
.bar.late{background:var(--warn)}
.bar.done{background:repeating-linear-gradient(45deg,rgba(30,122,74,.55) 0px,rgba(30,122,74,.55) 3px,#9EB3C8 3px,#9EB3C8 8px);border:1px solid rgba(30,122,74,.7)}
.bar-underline{position:absolute;top:31px;height:3px;border-radius:2px;min-width:2px}
.bar-tick{position:absolute;top:26px;width:2px;height:12px;border-radius:1px}
.bar-real-label{position:absolute;top:0;font-family:var(--mono);font-size:8px;font-weight:600;white-space:nowrap;pointer-events:none}

/*  LISTA DE TAREAS  */
.tarea-row{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--border2);border-radius:var(--r);padding:12px 14px;margin-bottom:8px;cursor:pointer;transition:var(--tr)}
.tarea-row:hover{background:var(--surface2)}
.tarea-row.critica{border-left-color:var(--danger)}
.tarea-row.atrasada{border-left-color:var(--warn)}
.pct-bar{height:5px;background:var(--surface3);border-radius:3px;overflow:hidden}
.pct-fill{height:100%;background:var(--action);border-radius:3px;transition:width 200ms cubic-bezier(.2,0,.38,.9)}
.pct-fill.critical{background:var(--danger)}
.pct-fill.done{background:var(--accent2)}
.recurso-tag{font-family:var(--mono);font-size:11px;color:var(--muted);background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:3px 8px}
.btn-cotizar{background:var(--action);color:#fff}
.btn-cotizar:hover{background:var(--navy)}

/*  DIAS HABILES · toggles de la semana laboral  */
.dia-btn{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.04em;min-width:44px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--r);border:1px solid var(--border2);cursor:pointer;user-select:none;transition:var(--tr)}
.dia-btn.active{background:var(--action);border-color:var(--action);color:#fff}
.dia-btn.inactive{background:var(--surface);color:var(--muted2)}
.dia-btn.inactive:hover{background:var(--surface2);color:var(--text);border-color:var(--muted2)}

/*  PANTALLA COMPLETA  */
.fullscreen-overlay{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column}
.fs-topbar{display:flex;align-items:center;gap:12px;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border);flex:0 0 auto}
.fs-title{font-size:15px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fs-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;font:500 13px/1 var(--sans);color:var(--muted);background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);cursor:pointer;transition:var(--tr)}
.fs-btn:hover{color:var(--text);background:var(--surface2)}
.fs-content{flex:1 1 auto;overflow:auto;padding:20px}

/*  POPOVER DE RESPONSABLE  */
.resp-cell{cursor:default}
.resp-cell-name{font-size:12px;color:var(--text);border-bottom:1px dotted var(--border2);white-space:nowrap}
.resp-popover{position:fixed;z-index:300;width:320px;max-height:340px;overflow:hidden;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);box-shadow:0 8px 24px rgba(15,20,25,.14)}
.resp-popover-hdr{display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--nav);color:#fff;flex:0 0 auto}
.resp-popover-hdr-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.resp-popover-body{padding:8px 12px 12px;overflow-y:auto}
.resp-pop-section{font-family:var(--mono);font-size:9px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted2);margin:8px 0 5px;padding-bottom:4px;border-bottom:1px solid var(--border)}
.resp-pop-row,.resp-pop-sub-row{display:flex;align-items:center;gap:8px;padding:3px 0}
.resp-pop-name{font-size:11px;color:var(--text);flex:1;min-width:0;word-break:break-word}
.resp-pop-sub-name{font-size:10px;color:var(--muted);flex:1;min-width:0;padding-left:10px;word-break:break-word}
.resp-pop-sub-name::before{content:'↳';margin-right:4px;color:var(--muted2)}
.resp-pop-badge{flex:0 0 auto}
.resp-pop-empty{font-size:11px;color:var(--muted2);padding:10px 0;text-align:center}
`;

const STATUS_PROYECTO = {
  planificado: { label: "Planificado", color: "b-gray" },
  en_curso:    { label: "En curso",    color: "b-blue" },
  completado:  { label: "Completado",  color: "b-green" },
  cancelado:   { label: "Cancelado",   color: "b-red" },
};

const STATUS_TAREA = {
  pendiente:  { label: "Pendiente",  color: "b-gray" },
  en_curso:   { label: "En curso",   color: "b-blue" },
  completada: { label: "Completada", color: "b-green" },
  atrasada:   { label: "Atrasada",   color: "b-amber" },
  bloqueada:  { label: "Bloqueada",  color: "b-red" },
};

const DIAS_SEMANA  = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_DEFAULT = [true, true, true, true, true, false, false];

const fmtDate  = d => d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "—";
const diffDays = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);
const today    = () => new Date().toISOString().split("T")[0];

// Une el catálogo de `perfiles` con los nombres YA asignados en tareas y subtareas.
// Motivo: si alguien está inactivo, tiene `activo` NULL, o directamente no tiene fila
// en `perfiles`, antes desaparecía del select y no se podía re-seleccionar.
// Devuelve [{ id, label, nota }] ordenado alfabéticamente.
const unirPerfiles = (perfiles, tareas) => {
  const asignados = new Set();
  (tareas || []).forEach(t => {
    [t?.owner, t?.responsable, ...((t?.subtareas || []).map(s => s?.responsable))].forEach(v => {
      const s = (v || "").trim();
      if (s) asignados.add(s.toLowerCase());
    });
  });

  const out = [], vistos = new Set();
  const push = (id, label, nota) => {
    const k = label.toLowerCase();
    if (!label || vistos.has(k)) return;
    vistos.add(k);
    out.push({ id, label, nota: nota || null });
  };

  (perfiles || []).forEach(p => {
    const label = (p?.nombre || p?.email || "").trim();
    if (!label) return;
    if (p.activo === false) {
      // Inactivo: solo se muestra si ya tiene algo asignado, para no perder el valor
      if (asignados.has(label.toLowerCase())) push(p.id, label, "inactivo");
      return;
    }
    push(p.id, label, null);
  });

  // Asignados que no están en el catálogo de perfiles
  (tareas || []).forEach(t => {
    [t?.owner, t?.responsable, ...((t?.subtareas || []).map(s => s?.responsable))].forEach(v => {
      const label = (v || "").trim();
      if (label) push(`ext-${label}`, label, "fuera del catálogo");
    });
  });

  return out.sort((a, b) => a.label.localeCompare(b.label, "es"));
};

//  ÍCONOS SVG · reemplazan a los emoji, que se pierden al copiar/pegar el archivo 
const Glyph = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const GLYPHS = {
  lapiz:    <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  carrito:  <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.5l2.6 12h11.3l2.1-8H6" /></>,
  persona:  <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  tarea:    <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8.5 12.5l2.4 2.4 4.6-5" /></>,
  chevronD: <path d="M6 9l6 6 6-6" />,
  chevronR: <path d="M9 6l6 6-6 6" />,
};

//  ESCALAS DEL GANTT · de más fina a más gruesa 
const ESCALAS = [
  { id: "dia",       label: "Días",       maxDias: 45,       minPx: 34 },
  { id: "semana",    label: "Semanas",    maxDias: 210,      minPx: 46 },
  { id: "mes",       label: "Meses",      maxDias: 1100,     minPx: 58 },
  { id: "trimestre", label: "Trimestres", maxDias: 3300,     minPx: 60 },
  { id: "semestre",  label: "Semestres",  maxDias: Infinity, minPx: 64 },
];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Inicio del período que contiene ms (todo en UTC: las fechas vienen como YYYY-MM-DD)
const bucketStart = (ms, unidad) => {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth();
  if (unidad === "dia")    return Date.UTC(y, m, dt.getUTCDate());
  if (unidad === "semana") return Date.UTC(y, m, dt.getUTCDate()) - ((dt.getUTCDay() + 6) % 7) * 86400000;
  if (unidad === "mes")       return Date.UTC(y, m, 1);
  if (unidad === "trimestre") return Date.UTC(y, Math.floor(m / 3) * 3, 1);
  return Date.UTC(y, m < 6 ? 0 : 6, 1);
};
const bucketNext = (ms, unidad) => {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth();
  if (unidad === "dia")    return ms + 86400000;
  if (unidad === "semana") return ms + 7 * 86400000;
  if (unidad === "mes")       return Date.UTC(y, m + 1, 1);
  if (unidad === "trimestre") return Date.UTC(y, m + 3, 1);
  return Date.UTC(y, m + 6, 1);
};
const bucketLabel = (ms, unidad) => {
  const dt = new Date(ms);
  const yy = String(dt.getUTCFullYear()).slice(2);
  const mes = MESES_CORTOS[dt.getUTCMonth()];
  if (unidad === "dia")       return `${dt.getUTCDate()} ${mes}`;
  if (unidad === "semana")    return `${dt.getUTCDate()}/${dt.getUTCMonth() + 1}`;
  if (unidad === "mes")       return `${mes} ${yy}`;
  if (unidad === "trimestre") return `Q${Math.floor(dt.getUTCMonth() / 3) + 1} ${yy}`;
  return `S${dt.getUTCMonth() < 6 ? 1 : 2} ${yy}`;
};

function calcFechaFin(inicio, duracion, diasHabiles) {
  if (!inicio || !duracion || !diasHabiles?.some(d => d)) return "";
  let cur = new Date(inicio + "T00:00:00");
  let restante = parseInt(duracion);
  while (restante > 0) {
    const dow = (cur.getDay() + 6) % 7;
    if (diasHabiles[dow]) restante--;
    if (restante > 0) cur.setDate(cur.getDate() + 1);
  }
  return cur.toISOString().split("T")[0];
}

//  API 
const api = {
  async getPerfiles() {
    // Sin .eq("activo", true): en Postgres NULL no matchea igualdad, así que los
    // perfiles con `activo` NULL (filas creadas antes de agregar la columna)
    // desaparecían del select. El filtrado se hace en unirPerfiles(), que además
    // conserva a los inactivos si ya tienen tareas asignadas.
    const { data, error } = await supabase.from("perfiles").select("id, nombre, email, activo, tipo").order("nombre");
    if (error) throw error;
    // Solo personas en los selects de owner/responsable. Las cuentas de buque y
    // sucursal existen en `perfiles` (necesitan loguearse) pero no son asignables.
    // `tipo` NULL cuenta como persona para no romper si falta la migración.
    return (data || []).filter(p => !["buque", "sucursal"].includes(p?.tipo));
  },
  async getRecursosCatalogo() {
    const { data, error } = await supabase.from("proyecto_recursos_catalogo").select("*").eq("activo", true).order("nombre");
    if (error) throw error;
    return data || [];
  },
  async agregarRecursoCatalogo(nombre) {
    const { data, error } = await supabase.from("proyecto_recursos_catalogo").insert([{ nombre, tipo: "otro" }]).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async getProyectos(filtros = {}) {
    let q = supabase.from("proyectos").select("*, proyecto_recursos(*), proyecto_tareas(*)").order("created_at", { ascending: false });
    if (filtros.empresa) q = q.eq("empresa", filtros.empresa);
    if (filtros.status)  q = q.eq("status",  filtros.status);
    const { data, error } = await q;
    if (error) throw error;
    const proyectos = data || [];
    if (proyectos.length) {
      const ids = proyectos.map(p => p.id);
      // Cargar contactos por separado
      const { data: contactos } = await supabase.from("proyecto_contactos").select("*").in("proyecto_id", ids);
      if (contactos) {
        proyectos.forEach(p => {
          p.proyecto_contactos = contactos.filter(c => c.proyecto_id === p.id);
        });
      }
      // Cargar subtareas por separado
      const { data: subtareas } = await supabase.from("proyecto_subtareas").select("*").in("proyecto_id", ids).order("fecha_inicio", { ascending: true });
      if (subtareas) {
        proyectos.forEach(p => {
          (p.proyecto_tareas || []).forEach(t => {
            t.subtareas = subtareas.filter(s => s.tarea_id === t.id);
          });
        });
      }
    }
    return proyectos;
  },
  async crearProyecto(proy, recursos, contactos) {
    // Insert sin select de relaciones para evitar schema cache
    const { data, error } = await supabase.from("proyectos").insert([proy]).select("id, nombre, empresa, status, tipo, cliente, responsable, fecha_inicio, fecha_fin, descripcion, created_at").maybeSingle();
    if (error) throw error;
    // FIX A2: error check en recursos y contactos
    if (recursos?.length) {
      const { error: eR } = await supabase.from("proyecto_recursos").insert(recursos.map(r => ({ nombre: r, proyecto_id: data.id })));
      if (eR) throw new Error("Error insertando recursos: " + eR.message);
    }
    if (contactos?.length) {
      const { error: eC } = await supabase.from("proyecto_contactos").insert(contactos.map(c => ({ ...c, proyecto_id: data.id })));
      if (eC) throw new Error("Error insertando contactos: " + eC.message);
    }
    return data;
  },
  async actualizarProyecto(id, cambios, recursos, contactos) {
    // Solo actualizar columnas propias de proyectos, sin relaciones
    const camposProyecto = { updated_at: new Date().toISOString() };
    const camposPermitidos = ["nombre","empresa","tipo","cliente","descripcion","fecha_inicio","fecha_fin","responsable","status"];
    camposPermitidos.forEach(k => { if (cambios[k] !== undefined) camposProyecto[k] = cambios[k]; });
    const { error: errUpdate } = await supabase.from("proyectos").update(camposProyecto).eq("id", id);
    if (errUpdate) throw new Error("Error actualizando proyecto: " + errUpdate.message);
    // Reemplazar recursos
    if (recursos !== undefined) {
      // FIX A3: error check en delete recursos
      const { error: errDelR } = await supabase.from("proyecto_recursos").delete().eq("proyecto_id", id);
      if (errDelR) throw new Error("Error borrando recursos: " + errDelR.message);
      if (recursos.length) {
        const { error: errInsR } = await supabase.from("proyecto_recursos").insert(recursos.map(r => ({ nombre: r, proyecto_id: id })));
        if (errInsR) throw new Error("Error insertando recursos: " + errInsR.message);
      }
    }
    // Reemplazar contactos
    if (contactos !== undefined) {
      const { error: errDelC } = await supabase.from("proyecto_contactos").delete().eq("proyecto_id", id);
      if (errDelC) throw new Error("Error borrando contactos: " + errDelC.message);
      if (contactos.length) {
        const { error: errInsC } = await supabase.from("proyecto_contactos").insert(contactos.map(c => ({ ...c, proyecto_id: id })));
        if (errInsC) throw new Error("Error insertando contactos: " + errInsC.message);
      }
    }
  },
  async eliminarProyecto(id) {
    // FIX C3: borrar en orden correcto para evitar FK violations
    // 1. Subtareas (dependen de proyecto_tareas)
    const { error: e0 } = await supabase.from("proyecto_subtareas").delete().eq("proyecto_id", id);
    if (e0) throw e0;
    // 2. Adjuntos (pueden tener tarea_id que referencia proyecto_tareas)
    const { error: eAdj } = await supabase.from("proyecto_adjuntos").delete().eq("proyecto_id", id);
    if (eAdj) throw eAdj;
    // 3. Tareas
    const { error: e1 } = await supabase.from("proyecto_tareas").delete().eq("proyecto_id", id);
    if (e1) throw e1;
    // 4. Recursos y contactos
    const { error: e2 } = await supabase.from("proyecto_recursos").delete().eq("proyecto_id", id);
    if (e2) throw e2;
    const { error: e3 } = await supabase.from("proyecto_contactos").delete().eq("proyecto_id", id);
    if (e3) throw e3;
    // 5. Proyecto
    const { error: e4 } = await supabase.from("proyectos").delete().eq("id", id);
    if (e4) throw e4;
  },
  async crearTarea(tarea) {
    // Whitelist de columnas reales en proyecto_tareas
    const camposPermitidos = [
      "nombre", "owner", "responsable", "proyecto_id",
      "fecha_inicio", "fecha_fin", "duracion_dias", "dependencias",
      "porcentaje_avance", "status", "notas", "dias_habiles",
      "fecha_real_fin", "razon_desvio",
    ];
    const sanitized = {};
    camposPermitidos.forEach(k => { if (tarea[k] !== undefined) sanitized[k] = tarea[k]; });
    // Convertir strings vacíos en campos de fecha a null (Supabase no acepta "")
    ["fecha_inicio", "fecha_fin", "fecha_real_fin"].forEach(k => {
      if (sanitized[k] === "") sanitized[k] = null;
    });
    sanitized.duracion_dias = parseInt(sanitized.duracion_dias) || 1;
    sanitized.porcentaje_avance = parseInt(sanitized.porcentaje_avance) || 0;
    const { data, error } = await supabase.from("proyecto_tareas").insert([sanitized]).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async actualizarTarea(id, cambios) {
    //  FIX: Whitelist de columnas reales en proyecto_tareas
    // Evita enviar campos calculados como 'subtareas' que disparan el error de schema cache
    const camposPermitidos = [
      "nombre", "owner", "responsable", "proyecto_id",
      "fecha_inicio", "fecha_fin", "duracion_dias", "dependencias",
      "porcentaje_avance", "status", "notas", "dias_habiles",
      "fecha_real_fin", "razon_desvio",
    ];
    const sanitized = {};
    camposPermitidos.forEach(k => { if (cambios[k] !== undefined) sanitized[k] = cambios[k]; });
    // Convertir strings vacíos en campos de fecha a null (Supabase no acepta "")
    ["fecha_inicio", "fecha_fin", "fecha_real_fin"].forEach(k => {
      if (sanitized[k] === "") sanitized[k] = null;
    });
    sanitized.duracion_dias = parseInt(sanitized.duracion_dias) || 1;
    sanitized.porcentaje_avance = parseInt(sanitized.porcentaje_avance) || 0;
    const { data, error } = await supabase.from("proyecto_tareas").update(sanitized).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async eliminarTarea(id) {
    // FIX C4: borrar subtareas primero para evitar FK violation
    const { error: eSub } = await supabase.from("proyecto_subtareas").delete().eq("tarea_id", id);
    if (eSub) throw eSub;
    const { error } = await supabase.from("proyecto_tareas").delete().eq("id", id);
    if (error) throw error;
  },
  async getAdjuntos(proyectoId) {
    const { data, error } = await supabase.from("proyecto_adjuntos").select("*").eq("proyecto_id", proyectoId).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async subirAdjunto(file, proyectoId, tareaId = null) {
    const ext = file.name.split(".").pop() || "bin";
    const nombreLimpio = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[^a-zA-Z0-9._-]/g, "_")                  // reemplazar especiales
      .replace(/_+/g, "_")                                // colapsar underscores
      .substring(0, 80);                                  // limitar largo
    const path = `proyectos/${proyectoId}/${Date.now()}_${nombreLimpio}`;
    const { error: errUp } = await supabase.storage.from("proyecto-adjuntos").upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (errUp) throw errUp;
    const { data: urlData } = supabase.storage.from("proyecto-adjuntos").getPublicUrl(path);
    const adjunto = {
      proyecto_id: proyectoId,
      tarea_id: tareaId || null,
      nombre: file.name,
      url: urlData.publicUrl,
      tipo: file.type || ext,
      tamanio: file.size,
    };
    const { data, error } = await supabase.from("proyecto_adjuntos").insert([adjunto]).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async eliminarAdjunto(id, url) {
    const path = url.split("/proyecto-adjuntos/")[1];
    if (path) {
      // A3: error de storage no bloquea el delete de DB (archivo puede quedar huérfano pero registro se limpia)
      const { error: storageErr } = await supabase.storage.from("proyecto-adjuntos").remove([path]);
      if (storageErr) console.error("Storage delete fallido (archivo huérfano):", storageErr.message);
    }
    const { error } = await supabase.from("proyecto_adjuntos").delete().eq("id", id);
    if (error) throw error;
  },
  //  Integración con módulo Compras 
  async crearRequisicionDesdeProjects(req, items) {
    // FIX C1: proyecto_origen_id / tarea_origen_id se guardan en observaciones
    // hasta que se creen las columnas en Supabase. No se incluyen en el insert.
    const { proyecto_origen_id: _poi, tarea_origen_id: _toi, ...reqLimpio } = req;
    const { data: nueva, error } = await supabase
      .from("requisiciones")
      .insert([{ ...reqLimpio, status: "pendiente_aprobacion" }])
      .select()
      .maybeSingle();
    if (error) throw error;
    // FIX C2: error check en insert de items
    if (items?.length) {
      const { error: errItems } = await supabase.from("requisicion_items").insert(
        items.map((it, i) => ({ ...it, requisicion_id: nueva.id, nro_linea: i + 1 }))
      );
      if (errItems) throw new Error("Error insertando ítems: " + errItems.message);
    }
    // FIX C2: error check en historial
    const { error: errHist } = await supabase.from("requisicion_historial").insert([{
      requisicion_id: nueva.id,
      evento: "Requisición creada desde módulo Projects",
      usuario: USUARIO,
      status_nuevo: "pendiente_aprobacion",
    }]);
    if (errHist) throw new Error("Error en historial: " + errHist.message);
    return nueva;
  },
  async getSubtareas(tareaId) {
    const { data, error } = await supabase.from("proyecto_subtareas").select("*").eq("tarea_id", tareaId).order("fecha_inicio", { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async crearSubtarea(subtarea) {
    const camposPermitidos = [
      "tarea_id", "proyecto_id", "descripcion", "responsable",
      "fecha_inicio", "fecha_fin", "fecha_real_fin", "razon_desvio", "porcentaje_avance",
    ];
    const sanitized = {};
    camposPermitidos.forEach(k => { if (subtarea[k] !== undefined) sanitized[k] = subtarea[k]; });
    // Convertir strings vacíos en campos de fecha a null (Supabase no acepta "")
    ["fecha_inicio", "fecha_fin", "fecha_real_fin"].forEach(k => {
      if (sanitized[k] === "") sanitized[k] = null;
    });
    sanitized.porcentaje_avance = parseInt(sanitized.porcentaje_avance) || 0;
    const { data, error } = await supabase.from("proyecto_subtareas").insert([sanitized]).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async actualizarSubtarea(id, cambios) {
    const camposPermitidos = [
      "descripcion", "responsable",
      "fecha_inicio", "fecha_fin", "fecha_real_fin", "razon_desvio", "porcentaje_avance",
    ];
    const sanitized = {};
    camposPermitidos.forEach(k => { if (cambios[k] !== undefined) sanitized[k] = cambios[k]; });
    // Convertir strings vacíos en campos de fecha a null (Supabase no acepta "")
    ["fecha_inicio", "fecha_fin", "fecha_real_fin"].forEach(k => {
      if (sanitized[k] === "") sanitized[k] = null;
    });
    sanitized.porcentaje_avance = parseInt(sanitized.porcentaje_avance) || 0;
    const { data, error } = await supabase.from("proyecto_subtareas").update(sanitized).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async eliminarSubtarea(id) {
    const { error } = await supabase.from("proyecto_subtareas").delete().eq("id", id);
    if (error) throw error;
  },
};

//  HELPERS 
function calcularCaminoCritico(tareas) {
  if (!tareas?.length) return new Set();
  const duracion = t => Math.max(parseInt(t.duracion_dias) || 1, 1);
  const earlyFinish = {};
  const sorted = [...tareas].sort((a, b) => (a.fecha_inicio || "") < (b.fecha_inicio || "") ? -1 : 1);
  sorted.forEach(t => {
    const deps = (t.dependencias || []).map(d => earlyFinish[d] || 0);
    earlyFinish[t.id] = (deps.length ? Math.max(...deps) : 0) + duracion(t);
  });
  const maxFinish = Math.max(...Object.values(earlyFinish));
  const lateFinish = {};
  const criticas = new Set();
  [...sorted].reverse().forEach(t => {
    const sucs = tareas.filter(s => (s.dependencias || []).includes(t.id));
    lateFinish[t.id] = sucs.length ? Math.min(...sucs.map(s => lateFinish[s.id] - duracion(s))) : maxFinish;
    if (Math.abs(lateFinish[t.id] - earlyFinish[t.id]) < 0.01) criticas.add(t.id);
  });
  return criticas;
}

function Notif({ msg, onClose }) {
  if (!msg) return null;
  const cls = { success: "n-green", error: "n-red", warn: "n-amber", info: "n-blue" }[msg.type] || "n-blue";
  return <div className={`notif ${cls}`}><span>{msg.text}</span><button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button></div>;
}

function FG({ label, hint, children, full }) {
  return <div className="fg" style={full ? { gridColumn: "1/-1" } : {}}>
    {label && <label>{label}</label>}
    {children}
    {hint && <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{hint}</div>}
  </div>;
}

function PctBar({ pct, critica }) {
  return <div className="pct-bar"><div className={`pct-fill ${critica ? "critical" : pct >= 100 ? "done" : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>;
}

//  MODAL: COTIZAR DESDE PROJECTS 
// Se abre desde tarea o subtarea. Genera una requisición en el módulo Compras.
function CotizarDesdeProjectsModal({ origen, proyectoEmpresa, proyectoNombre, onClose, notify }) {
  // origen: { tipo: "tarea"|"subtarea", nombre, id, ... }
  const empresaDefault = EMPRESAS.includes(proyectoEmpresa) ? proyectoEmpresa : "Parana Logistica";
  const [form, setForm] = useState({
    empresa: empresaDefault,
    base_buque: "",
    subarea: "",
    urgencia: "Normal",
    tipo_requisicion: "Bienes",
    solicitado_por: USUARIO,
    fecha_necesaria: "",
    // FIX C1: referencia al origen guardada en observaciones (hasta migración DB)
    observaciones: `Generado desde proyecto: ${proyectoNombre} — ${origen.tipo === "subtarea" ? "Subtarea" : "Tarea"}: ${origen.nombre} [ref:proy=${origen.proyectoId || ""},tarea=${origen.id || ""}]`,
  });
  const [items, setItems] = useState([
    { id: "i1", descripcion: origen.nombre, cantidad: 1, unidad: "Uni", proveedor_sugerido: "" }
  ]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => { const its = [...items]; its[i] = { ...its[i], [k]: v }; setItems(its); };
  const addItem = () => setItems(prev => [...prev, { id: `i${Date.now()}`, descripcion: "", cantidad: 1, unidad: "Uni", proveedor_sugerido: "" }]);

  const bases = BASES_POR_EMPRESA[form.empresa] || [];
  const subareas = SUBAREA_TECNICA[form.empresa] || [];

  const handleSave = async () => {
    if (!form.base_buque || !form.subarea || !form.solicitado_por) {
      alert("Completá: Base/Buque, Sub-área y Solicitado por");
      return;
    }
    if (!items.some(it => it.descripcion.trim())) {
      alert("Agregá al menos un ítem con descripción");
      return;
    }
    setSaving(true);
    try {
      const reqData = {
        titulo: `[Projects] ${origen.nombre}`,
        empresa: form.empresa,
        area: "Tecnica",
        base_buque: form.base_buque,
        subarea: form.subarea,
        urgencia: form.urgencia,
        tipo_requisicion: form.tipo_requisicion,
        solicitado_por: form.solicitado_por,
        fecha_necesaria: form.fecha_necesaria || null,
        observaciones: form.observaciones,
        // FIX C1: columnas de trazabilidad en observaciones por ahora.
        // Una vez ejecutada la migración SQL se pueden descomentar:
        // proyecto_origen_id: origen.proyectoId || null,
        // tarea_origen_id: origen.id || null,
      };
      const cleanItems = items
        .filter(it => it.descripcion.trim())
        .map(({ id: _id, ...rest }) => rest);
      const nueva = await api.crearRequisicionDesdeProjects(reqData, cleanItems);
      // FIX A1: nro_solicitud puede ser null si es generado por trigger
      const nroDisplay = nueva.nro_solicitud
        ? String(nueva.nro_solicitud).padStart(4, "0")
        : nueva.id.slice(0, 8).toUpperCase();
      notify(`✓ Requisición REQ-${nroDisplay} creada en Compras`, "success");
      onClose();
    } catch (e) {
      alert("Error al crear requisición: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="mhdr">
          <div>
            <div className="mtitle"> Generar pedido de compra</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {origen.tipo === "subtarea" ? "Subtarea" : "Tarea"}: <strong>{origen.nombre}</strong>
            </div>
          </div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">

          <div className="info-box accent mb12" style={{ fontSize: 11 }}>
            Se creará una requisición en el módulo Compras con estado <strong>Pendiente de aprobación</strong>.
          </div>

          {/* Empresa + Base */}
          <div className="form-grid">
            <FG label="Empresa *">
              <select value={form.empresa} onChange={e => { set("empresa", e.target.value); set("base_buque", ""); set("subarea", ""); }}>
                {EMPRESAS.map(e => <option key={e}>{e}</option>)}
              </select>
            </FG>
            <FG label="Base / Buque *">
              <select value={form.base_buque} onChange={e => set("base_buque", e.target.value)}>
                <option value="">Seleccionar...</option>
                {bases.map(b => <option key={b}>{b}</option>)}
              </select>
            </FG>
            <FG label="Sub-área *">
              <select value={form.subarea} onChange={e => set("subarea", e.target.value)}>
                <option value="">Seleccionar...</option>
                {subareas.map(s => <option key={s}>{s}</option>)}
              </select>
            </FG>
            <FG label="Urgencia">
              <select value={form.urgencia} onChange={e => set("urgencia", e.target.value)}>
                {URGENCIA_OPTIONS.map(u => <option key={u}>{u}</option>)}
              </select>
            </FG>
            <FG label="Tipo de requisición">
              <select value={form.tipo_requisicion} onChange={e => set("tipo_requisicion", e.target.value)}>
                {TIPOS_REQUISICION_PROJECTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </FG>
            <FG label="Solicitado por *">
              <input value={form.solicitado_por} onChange={e => set("solicitado_por", e.target.value)} />
            </FG>
            <FG label="Fecha necesaria">
              <input type="date" value={form.fecha_necesaria} onChange={e => set("fecha_necesaria", e.target.value)} />
            </FG>
          </div>
          <FG label="Observaciones" full>
            <textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} rows={2} />
          </FG>

          {/* Ítems */}
          <div className="form-section" style={{ marginTop: 18 }}>Ítems a cotizar</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--surface2)" }}>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: .5, textTransform: "uppercase", borderBottom: "2px solid var(--border)", width: "50%" }}>Descripción *</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: .5, textTransform: "uppercase", borderBottom: "2px solid var(--border)" }}>Cant.</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, color: "var(--muted)", fontWeight: 600, letterSpacing: .5, textTransform: "uppercase", borderBottom: "2px solid var(--border)" }}>Unid.</th>
                  <th style={{ padding: "7px 10px", borderBottom: "2px solid var(--border)" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id}>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                      <input
                        value={it.descripcion}
                        onChange={e => setItem(i, "descripcion", e.target.value)}
                        placeholder="Descripción del material o servicio"
                        style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 8px", fontFamily: "var(--sans)", fontSize: 12, outline: "none" }}
                      />
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                      <input
                        type="number" min={1} value={it.cantidad}
                        onChange={e => setItem(i, "cantidad", parseInt(e.target.value) || 1)}
                        style={{ width: 60, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 8px", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }}
                      />
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                      <input
                        value={it.unidad}
                        onChange={e => setItem(i, "unidad", e.target.value)}
                        style={{ width: 60, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 8px", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }}
                      />
                    </td>
                    <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                      {items.length > 1 && (
                        <button
                          onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", color: "var(--muted2)", cursor: "pointer", fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--muted2)"}
                        >✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-ghost btn-sm mt8" onClick={addItem}>+ Agregar ítem</button>

        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-cotizar"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Creando..." : " Crear pedido de compra"}
          </button>
        </div>
      </div>
    </div>
  );
}

//  MODAL PROYECTO 
function ProyectoModal({ proyecto, onClose, onSave }) {
  const [form, setForm] = useState({
    empresa: "Parana Logistica", nombre: "", tipo: "interno", cliente: "",
    descripcion: "", fecha_inicio: "", fecha_fin: "", responsable: "", status: "planificado",
    ...(proyecto || {}),
  });

  // Recursos: array de strings (nombres)
  const [recursos, setRecursos] = useState(proyecto?.proyecto_recursos?.map(r => r.nombre) || []);
  // Contactos: array de {nombre, email}
  const [contactos, setContactos] = useState(proyecto?.proyecto_contactos || []);
  // Catálogo de recursos desde Supabase
  const [recursosCatalogo, setRecursosCatalogo] = useState([]);
  // Perfiles desde Supabase
  const [perfiles, setPerfiles] = useState([]);
  // Estado para agregar recurso manual
  const [nuevoRecursoManual, setNuevoRecursoManual] = useState("");
  const [agregandoRecurso, setAgregandoRecurso] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([api.getPerfiles(), api.getRecursosCatalogo()])
      .then(([p, r]) => { setPerfiles(p); setRecursosCatalogo(r); })
      .catch(e => console.error("Error cargando catálogos:", e));
  }, []);

  // Catálogo + el responsable ya guardado, para que nunca se pierda el valor actual
  const opcionesPersona = unirPerfiles(perfiles, [{ responsable: form.responsable }]);

  //  Recursos 
  const toggleRecurso = (nombre) => {
    setRecursos(prev =>
      prev.includes(nombre) ? prev.filter(r => r !== nombre) : [...prev, nombre]
    );
  };

  const handleAgregarRecursoManual = async () => {
    const nombre = nuevoRecursoManual.trim();
    if (!nombre) return;
    setAgregandoRecurso(true);
    try {
      const nuevo = await api.agregarRecursoCatalogo(nombre);
      setRecursosCatalogo(prev => [...prev, nuevo]);
      setRecursos(prev => [...prev, nuevo.nombre]);
      setNuevoRecursoManual("");
    } catch (e) {
      // Si ya existe, simplemente agregarlo a la selección
      if (!recursos.includes(nombre)) setRecursos(prev => [...prev, nombre]);
      setNuevoRecursoManual("");
    } finally { setAgregandoRecurso(false); }
  };

  //  Contactos 
  const addContacto = () => setContactos(prev => [...prev, { nombre: "", email: "" }]);
  const setContacto = (i, k, v) => {
    const arr = [...contactos];
    arr[i] = { ...arr[i], [k]: v };
    setContactos(arr);
  };
  const removeContacto = (i) => setContactos(prev => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (!form.nombre || !form.empresa) return alert("Completá nombre y empresa");
    setSaving(true);
    try {
      const contactosValidos = contactos.filter(c => c.nombre?.trim() || c.email?.trim());
      if (proyecto) {
        await api.actualizarProyecto(proyecto.id, form, recursos, contactosValidos);
      } else {
        await api.crearProyecto(form, recursos, contactosValidos);
      }
      onSave();
    } catch (e) { alert("Error: " + (e.message || JSON.stringify(e))); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">{proyecto ? "Editar proyecto" : "Nuevo proyecto"}</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">

          {/*  Datos generales  */}
          <div className="form-section">Datos generales</div>
          <div className="form-grid">
            <FG label="Empresa *">
              <select value={form.empresa} onChange={e => set("empresa", e.target.value)}>
                {EMPRESAS.map(e => <option key={e}>{e}</option>)}
              </select>
            </FG>
            <FG label="Tipo">
              <select value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </FG>
          </div>
          <div className="form-grid">
            <FG label="Nombre *" full>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Varada Golondrina 2026" />
            </FG>
          </div>
          <div className="form-grid">
            <FG label="Cliente (opcional)">
              <input value={form.cliente || ""} onChange={e => set("cliente", e.target.value)} placeholder="Ej: Fugro" />
            </FG>
            <FG label="Responsable">
              <select value={form.responsable || ""} onChange={e => set("responsable", e.target.value)}>
                <option value="">Sin asignar</option>
                {opcionesPersona.map(p => (
                  <option key={p.id} value={p.label}>{p.label}{p.nota ? ` · ${p.nota}` : ""}</option>
                ))}
              </select>
            </FG>
            <FG label="Fecha inicio">
              <input type="date" value={form.fecha_inicio || ""} onChange={e => set("fecha_inicio", e.target.value)} />
            </FG>
            <FG label="Fecha fin estimada">
              <input type="date" value={form.fecha_fin || ""} onChange={e => set("fecha_fin", e.target.value)} />
            </FG>
          </div>
          <div className="form-grid">
            <FG label="Status">
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                {Object.entries(STATUS_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FG>
          </div>
          <FG label="Descripción" full>
            <textarea value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)} placeholder="Descripción del proyecto..." />
          </FG>

          {/*  Contactos de cliente  */}
          <div className="form-section">Contactos de cliente</div>
          {contactos.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Sin contactos — opcional</div>
          )}
          {contactos.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 8, alignItems: "end" }}>
              <FG label={i === 0 ? "Nombre" : ""}>
                <input value={c.nombre || ""} onChange={e => setContacto(i, "nombre", e.target.value)} placeholder="Ej: Juan Pérez" />
              </FG>
              <FG label={i === 0 ? "Email" : ""}>
                <input type="email" value={c.email || ""} onChange={e => setContacto(i, "email", e.target.value)} placeholder="juan@empresa.com" />
              </FG>
              <button
                onClick={() => removeContacto(i)}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--muted2)", cursor: "pointer", fontSize: 14, padding: "8px 10px", marginBottom: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--muted2)"}
              >✕</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addContacto}>+ Agregar contacto</button>

          {/*  Recursos asignados  */}
          <div className="form-section">Recursos asignados</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {recursosCatalogo.map(r => (
              <div
                key={r.id}
                onClick={() => toggleRecurso(r.nombre)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: recursos.includes(r.nombre) ? "var(--blue)" : "var(--surface2)",
                  color: recursos.includes(r.nombre) ? "#fff" : "var(--muted)",
                  border: `1px solid ${recursos.includes(r.nombre) ? "var(--blue)" : "var(--border)"}`,
                  borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", transition: "all .12s", userSelect: "none",
                }}
              >
                {recursos.includes(r.nombre) ? "✓ " : ""}{r.nombre}
              </div>
            ))}
          </div>
          {/* Agregar recurso manual */}
          <div className="flex-gap">
            <input
              value={nuevoRecursoManual}
              onChange={e => setNuevoRecursoManual(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAgregarRecursoManual()}
              placeholder="Agregar recurso nuevo..."
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "7px 10px", fontSize: 12, fontFamily: "var(--sans)", outline: "none" }}
            />
            <button className="btn btn-ghost btn-sm" onClick={handleAgregarRecursoManual} disabled={agregandoRecurso || !nuevoRecursoManual.trim()}>
              {agregandoRecurso ? "..." : "+ Agregar"}
            </button>
          </div>
          <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 6 }}>
            Los recursos nuevos se guardan en el catálogo para usar en futuros proyectos.
          </div>

        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar proyecto"}</button>
        </div>
      </div>
    </div>
  );
}

//  MODAL TAREA 
function TareaModal({ tarea, proyectoId, tareas, onClose, onSave, onEliminar, notify }) {
  const parseDias = (d) => Array.isArray(d) && d.length === 7 ? d : [...DIAS_DEFAULT];
  const [form, setForm] = useState({
    proyecto_id: proyectoId, nombre: "", owner: "", responsable: "",
    fecha_inicio: "", fecha_fin: "", duracion_dias: 1, dependencias: [],
    porcentaje_avance: 0, status: "pendiente", notas: "", dias_habiles: [...DIAS_DEFAULT],
    fecha_real_fin: "", razon_desvio: "",
    ...(tarea || {}),
    dias_habiles: parseDias(tarea?.dias_habiles),
    duracion_dias: parseInt(tarea?.duracion_dias) || 1,
    porcentaje_avance: parseInt(tarea?.porcentaje_avance) || 0,
    fecha_real_fin: tarea?.fecha_real_fin || "",
    razon_desvio: tarea?.razon_desvio || "",
  });
  const [perfiles, setPerfiles]         = useState([]);
  const [perfilesError, setPerfilesError] = useState(null);
  const [subtareas, setSubtareas]       = useState([]);
  const [saving, setSaving]             = useState(false);
  const [savingSubtarea, setSavingSubtarea] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [tabModal, setTabModal]         = useState(tarea?._openSubtarea ? "subtareas" : "datos");
  const [editSubtareaId, setEditSubtareaId] = useState(null);
  const [subForm, setSubForm]           = useState({ descripcion: "", fecha_inicio: "", fecha_fin: "", porcentaje_avance: 0, responsable: "", fecha_real_fin: "", razon_desvio: "" });
  const [confirmEliminarSubId, setConfirmEliminarSubId] = useState(null);
  const [cotizarOrigen, setCotizarOrigen] = useState(null); // { tipo, nombre, id, proyectoId }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSub = (k, v) => setSubForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.getPerfiles()
      .then(ps => { setPerfiles(ps); setPerfilesError(null); })
      .catch(e => {
        console.error("Perfiles:", e);
        setPerfilesError(e.message);
        notify?.("No se pudieron cargar los perfiles: " + e.message, "error");
      });
    if (tarea?.id) {
      api.getSubtareas(tarea.id).then(subs => {
        setSubtareas(subs);
        // Si se abrió desde el gantt con una subtarea específica, pre-cargar para editar
        if (tarea._openSubtarea) {
          const s = tarea._openSubtarea;
          setEditSubtareaId(s.id);
          setSubForm({ descripcion: s.descripcion, fecha_inicio: s.fecha_inicio || "", fecha_fin: s.fecha_fin || "", porcentaje_avance: s.porcentaje_avance || 0, responsable: s.responsable || "" });
        }
      }).catch(e => console.error("Subtareas:", e));
    }
  }, [tarea?.id]);

  // Bloquear cierre accidental con Escape o Delete fuera de inputs
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const enInput = ["input", "textarea", "select"].includes(tag);
      if ((e.key === "Escape" || e.key === "Delete") && !enInput) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  useEffect(() => {
    const fin = calcFechaFin(form.fecha_inicio, form.duracion_dias, form.dias_habiles);
    if (fin) set("fecha_fin", fin);
  }, [form.fecha_inicio, form.duracion_dias, JSON.stringify(form.dias_habiles)]);

  const toggleDia = (i) => { const dias = [...form.dias_habiles]; dias[i] = !dias[i]; set("dias_habiles", dias); };
  const toggleDep = (id) => {
    const deps = form.dependencias || [];
    set("dependencias", deps.includes(id) ? deps.filter(d => d !== id) : [...deps, id]);
  };

  const handleSave = async () => {
    if (!form.nombre) return alert("El nombre es obligatorio");
    if (!form.dias_habiles.some(d => d)) return alert("Seleccioná al menos un día hábil");
    setSaving(true);
    try {
      tarea?.id ? await api.actualizarTarea(tarea.id, form) : await api.crearTarea(form);
      onSave();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  //  Subtareas 
  const blankSubForm = () => ({ descripcion: "", fecha_inicio: form.fecha_inicio || "", fecha_fin: form.fecha_fin || "", porcentaje_avance: 0, responsable: "", fecha_real_fin: "", razon_desvio: "" });
  // fecha_real_fin y razon_desvio se incluyen en el objeto pero solo se muestran en edición (ver UI abajo)

  const handleGuardarSubtarea = async () => {
    if (!subForm.descripcion.trim()) return alert("La descripción es obligatoria");
    // Validar que fechas estén dentro de la tarea madre
    if (form.fecha_inicio && subForm.fecha_inicio && subForm.fecha_inicio < form.fecha_inicio)
      return alert(`La fecha de inicio no puede ser anterior a la tarea madre (${fmtDate(form.fecha_inicio)})`);
    if (form.fecha_fin && subForm.fecha_fin && subForm.fecha_fin > form.fecha_fin)
      return alert(`La fecha de fin no puede ser posterior a la tarea madre (${fmtDate(form.fecha_fin)})`);
    setSavingSubtarea(true);
    try {
      if (editSubtareaId) {
        const updated = await api.actualizarSubtarea(editSubtareaId, subForm);
        setSubtareas(prev => prev.map(s => s.id === editSubtareaId ? updated : s));
      } else {
        const nueva = await api.crearSubtarea({ ...subForm, tarea_id: tarea.id, proyecto_id: proyectoId });
        setSubtareas(prev => [...prev, nueva]);
      }
      setSubForm(blankSubForm());
      setEditSubtareaId(null);
    } catch (e) { alert("Error: " + e.message); }
    finally { setSavingSubtarea(false); }
  };

  const handleEditarSubtarea = (s) => {
    setEditSubtareaId(s.id);
    setSubForm({ descripcion: s.descripcion, fecha_inicio: s.fecha_inicio || "", fecha_fin: s.fecha_fin || "", porcentaje_avance: s.porcentaje_avance || 0, responsable: s.responsable || "", fecha_real_fin: s.fecha_real_fin || "", razon_desvio: s.razon_desvio || "" });
  };

  const handleEliminarSubtarea = async (id) => {
    if (confirmEliminarSubId !== id) { setConfirmEliminarSubId(id); return; }
    setConfirmEliminarSubId(null);
    try {
      await api.eliminarSubtarea(id);
      setSubtareas(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert("Error al eliminar subtarea: " + e.message);
    }
  };

  const otrasTareas = tareas.filter(t => t.id !== tarea?.id);
  // Catálogo + gente ya asignada en este proyecto (incluye subtareas cargadas)
  const opcionesPersona = unirPerfiles(
    perfiles,
    [...(tareas || []), { subtareas }, { owner: form.owner, responsable: form.responsable }]
  );

  const inStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text)", fontFamily: "var(--sans)", fontSize: 12, padding: "6px 10px", outline: "none", width: "100%" };

  return (
    <>
    <div className="overlay">
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">{tarea?.id ? "Editar tarea" : "Nueva tarea"}</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>

        {/* Tabs del modal */}
        <div className="tabs-row" style={{ background: "var(--surface2)", marginBottom: 0 }}>
          {[
            { id: "datos", label: "Datos" },
            { id: "subtareas", label: `Subtareas${subtareas.length ? ` (${subtareas.length})` : ""}` },
            { id: "adjuntos", label: " Adjuntos" },
          ].map(t => (
            <div key={t.id}
              className={`tab ${tabModal === t.id ? "active" : ""}`}
              onClick={() => setTabModal(t.id)}
            >{t.label}</div>
          ))}
        </div>

        <div className="mbody">

          {/*  TAB DATOS  */}
          {tabModal === "datos" && <>
            <div className="form-grid">
              <FG label="Nombre *" full><input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Limpieza de casco" /></FG>
              <FG label="Owner (responsable final)">
                <select value={form.owner || ""} onChange={e => set("owner", e.target.value)}>
                  <option value="">Sin asignar</option>
                  {opcionesPersona.map(p => <option key={p.id} value={p.label}>{p.label}{p.nota ? ` · ${p.nota}` : ""}</option>)}
                </select>
              </FG>
              <FG label="Responsable de ejecución">
                <select value={form.responsable || ""} onChange={e => set("responsable", e.target.value)}>
                  <option value="">Sin asignar</option>
                  {opcionesPersona.map(p => <option key={p.id} value={p.label}>{p.label}{p.nota ? ` · ${p.nota}` : ""}</option>)}
                </select>
              </FG>
              {perfilesError && (
                <div className="info-box danger" style={{ gridColumn: "1 / -1", fontSize: 11 }}>
                  No se pudo leer la tabla <code>perfiles</code> ({perfilesError}). El listado
                  muestra solo a las personas ya asignadas en este proyecto. Revisá las políticas
                  RLS de <code>perfiles</code> para el rol <code>authenticated</code>.
                </div>
              )}
              <FG label="Status">
                <select value={form.status} onChange={e => set("status", e.target.value)}>
                  {Object.entries(STATUS_TAREA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </FG>
              <FG label="Fecha inicio *"><input type="date" value={form.fecha_inicio || ""} onChange={e => set("fecha_inicio", e.target.value)} /></FG>
              <FG label="Duración (días hábiles)"><input type="number" min={1} value={form.duracion_dias} onChange={e => set("duracion_dias", parseInt(e.target.value) || 1)} /></FG>
              <FG label="Fecha fin (calculada)"><input value={form.fecha_fin ? fmtDate(form.fecha_fin) : "—"} readOnly style={{ background: "var(--surface2)", color: "var(--muted)", cursor: "not-allowed" }} /></FG>
              <FG label="% Avance"><input type="number" min={0} max={100} value={form.porcentaje_avance} onChange={e => set("porcentaje_avance", parseInt(e.target.value) || 0)} /></FG>
            </div>
            {/*  Cierre real y desvío  */}
            <div className="form-section">Cierre real y desvío</div>
            <div className="form-grid">
              <FG label="Fecha real de finalización" hint="Cuándo se completó efectivamente">
                <input type="date" value={form.fecha_real_fin || ""} onChange={e => set("fecha_real_fin", e.target.value)} />
              </FG>
              <FG label="Razón del desvío (opcional)" hint="Demora, adelanto, o sin desvío">
                <input value={form.razon_desvio || ""} onChange={e => set("razon_desvio", e.target.value)} placeholder="Ej: Espera de repuestos, clima adverso..." />
              </FG>
            </div>
            <div className="form-section">Días hábiles</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} onClick={() => toggleDia(i)} className={`dia-btn ${form.dias_habiles[i] ? "active" : "inactive"}`}>{d}</div>
              ))}
            </div>
            <FG label="Notas" full><textarea value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Observaciones..." /></FG>
            {otrasTareas.length > 0 && <>
              <div className="form-section">Dependencias</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {otrasTareas.map(t => (
                  <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                    <input type="checkbox" checked={(form.dependencias || []).includes(t.id)} onChange={() => toggleDep(t.id)} style={{ accentColor: "var(--blue)" }} />
                    <span>{t.nombre}</span>
                    {t.fecha_fin && <span style={{ fontSize: 10, color: "var(--muted)" }}>hasta {fmtDate(t.fecha_fin)}</span>}
                  </label>
                ))}
              </div>
            </>}
          </>}

          {/*  TAB SUBTAREAS  */}
          {tabModal === "subtareas" && <>
            {!tarea?.id
              ? <div className="info-box accent" style={{ fontSize: 12 }}>Guardá la tarea primero para poder agregar subtareas.</div>
              : <>
                  {/* Formulario nueva/editar subtarea */}
                  <div className="card" style={{ margin: 0, marginBottom: 14, padding: 14, background: "var(--surface2)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--blue)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                      {editSubtareaId ? "Editando subtarea" : "Nueva subtarea"}
                    </div>
                    <FG label="Descripción *">
                      <input value={subForm.descripcion} onChange={e => setSub("descripcion", e.target.value)} placeholder="Ej: Cotizar materiales" style={inStyle} />
                    </FG>
                    <div className="form-grid" style={{ marginTop: 10 }}>
                      <FG label="Fecha inicio">
                        <input type="date" value={subForm.fecha_inicio} onChange={e => setSub("fecha_inicio", e.target.value)}
                          min={form.fecha_inicio || undefined} max={form.fecha_fin || undefined} />
                      </FG>
                      <FG label="Fecha fin">
                        <input type="date" value={subForm.fecha_fin} onChange={e => setSub("fecha_fin", e.target.value)}
                          min={subForm.fecha_inicio || form.fecha_inicio || undefined} max={form.fecha_fin || undefined} />
                      </FG>
                      <FG label="% Avance">
                        <input type="number" min={0} max={100} value={subForm.porcentaje_avance} onChange={e => setSub("porcentaje_avance", parseInt(e.target.value) || 0)} />
                      </FG>
                      <FG label="Responsable">
                        <select value={subForm.responsable} onChange={e => setSub("responsable", e.target.value)}>
                          <option value="">Sin asignar</option>
                          {opcionesPersona.map(p => <option key={p.id} value={p.label}>{p.label}{p.nota ? ` · ${p.nota}` : ""}</option>)}
                        </select>
                      </FG>
                      {/* fecha_real_fin y razon_desvio solo en edición — al crear no tiene sentido completarlos */}
                      {editSubtareaId && <>
                        <FG label="Fecha real de fin" hint="Cuándo se completó">
                          <input type="date" value={subForm.fecha_real_fin || ""} onChange={e => setSub("fecha_real_fin", e.target.value)} />
                        </FG>
                        <FG label="Razón del desvío" hint="Opcional">
                          <input value={subForm.razon_desvio || ""} onChange={e => setSub("razon_desvio", e.target.value)} placeholder="Ej: Material llegó tarde..." />
                        </FG>
                      </>}
                    </div>
                    {form.fecha_inicio && form.fecha_fin && (
                      <div style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 8 }}>
                        Rango de la tarea madre: {fmtDate(form.fecha_inicio)} → {fmtDate(form.fecha_fin)}
                      </div>
                    )}
                    <div className="flex-gap" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                      {editSubtareaId && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditSubtareaId(null); setSubForm(blankSubForm()); }}>Cancelar</button>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={handleGuardarSubtarea} disabled={savingSubtarea || !subForm.descripcion.trim()}>
                        {savingSubtarea ? "..." : editSubtareaId ? "Guardar cambios" : "+ Agregar"}
                      </button>
                    </div>
                  </div>

                  {/* Lista subtareas */}
                  {subtareas.length === 0
                    ? <div className="empty-state" style={{ padding: "24px 0" }}>Sin subtareas</div>
                    : subtareas.map(s => (
                        <div key={s.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 8 }}>
                          <div className="flex-between">
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)" }}>{s.descripcion}</div>
                            <div className="flex-gap">
                              <button
                                className="btn btn-cotizar btn-sm"
                                onClick={() => setCotizarOrigen({ tipo: "subtarea", nombre: s.descripcion, id: s.id, proyectoId, proyectoEmpresa: tarea?._empresa, proyectoNombre: tarea?._proyectoNombre })}
                                title="Generar pedido de compra para esta subtarea"
                              ><Glyph d={GLYPHS.carrito} /> Cotizar</button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleEditarSubtarea(s)}
                                title="Editar subtarea"
                              ><Glyph d={GLYPHS.lapiz} /> Editar</button>
                              {confirmEliminarSubId === s.id ? (
                                <span className="flex-gap">
                                  <span style={{ fontSize: 10, color: "var(--danger)" }}>¿Eliminar?</span>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleEliminarSubtarea(s.id)}>Sí</button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmEliminarSubId(null)}>No</button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleEliminarSubtarea(s.id)}
                                  style={{ background: "none", border: "none", color: "var(--muted2)", cursor: "pointer", fontSize: 14 }}
                                  onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted2)"}
                                >✕</button>
                              )}
                            </div>
                          </div>
                          <div className="req-meta mt8">
                            {s.responsable && <span> {s.responsable}</span>}
                            {s.fecha_inicio && <><span>·</span><span>{fmtDate(s.fecha_inicio)} → {fmtDate(s.fecha_fin)}</span></>}
                            <span>·</span><span>{s.porcentaje_avance || 0}% avance</span>
                          </div>
                          <div className="mt8"><PctBar pct={s.porcentaje_avance || 0} /></div>
                        </div>
                      ))
                  }
                </>
            }
          </>}

          {/*  TAB ADJUNTOS  */}
          {tabModal === "adjuntos" && <>
            {!tarea?.id
              ? <div className="info-box accent" style={{ fontSize: 12 }}>Guardá la tarea primero para poder adjuntar archivos.</div>
              : <AdjuntosPanel proyectoId={proyectoId} tareaId={tarea.id} notify={() => {}} />
            }
          </>}

        </div>

        <div className="mftr" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            {tarea?.id && !confirmEliminar && (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmEliminar(true)}>✕ Eliminar tarea</button>
            )}
            {tarea?.id && confirmEliminar && (
              <div className="flex-gap">
                <span style={{ fontSize: 11, color: "var(--danger)" }}>¿Confirmar?</span>
                <button className="btn btn-danger btn-sm" onClick={() => onEliminar(tarea.id)}>Sí, eliminar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmEliminar(false)}>No</button>
              </div>
            )}
          </div>
          <div className="flex-gap">
            {/* Botón cotizar tarea */}
            {tarea?.id && (
              <button
                className="btn btn-cotizar btn-sm"
                onClick={() => setCotizarOrigen({ tipo: "tarea", nombre: tarea.nombre, id: tarea.id, proyectoId, proyectoEmpresa: tarea._empresa, proyectoNombre: tarea._proyectoNombre })}
              > Cotizar</button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar tarea"}</button>
          </div>
        </div>
      </div>
    </div>
    {/* Modal de cotización */}
    {cotizarOrigen && (
      <CotizarDesdeProjectsModal
        origen={cotizarOrigen}
        proyectoEmpresa={cotizarOrigen.proyectoEmpresa || null}
        proyectoNombre={cotizarOrigen.proyectoNombre || ""}
        onClose={() => setCotizarOrigen(null)}
        notify={notify || (() => {})}
      />
    )}
  </>
  );
}

//  RESPONSABLE POPOVER 
// Muestra un popover al hacer hover sobre el nombre del responsable en la tabla.
// tareasMadre: tareas cuyo responsable === resp (solo las propias del responsable)
// subtareasDelResp: subtareas cuyo responsable propio === resp (de cualquier tarea)
function ResponsablePopover({ resp, tareas, subsPorResponsable, today }) {
  const [pos, setPos]     = useState(null);  // { top, left }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = (e) => {
    clearTimeout(timerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    // Posicionar a la derecha del nombre; si no cabe, a la izquierda
    const winW  = window.innerWidth;
    const popW  = 360;
    const left  = rect.right + 8 + popW > winW ? rect.left - popW - 8 : rect.right + 8;
    const top   = Math.min(rect.top, window.innerHeight - 420);
    setPos({ top, left });
    setVisible(true);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setVisible(false), 120);
  };

  // Tareas donde este responsable es el responsable de la tarea
  const misTareas = tareas.filter(t => (t.responsable || "Sin asignar") === resp);
  // Subtareas donde este responsable es el responsable propio de la subtarea
  const misSubtareas = [];
  tareas.forEach(t => {
    (t.subtareas || []).forEach(s => {
      const r = s.responsable || t.responsable || "Sin asignar";
      if (r === resp) misSubtareas.push({ sub: s, tareaMadre: t });
    });
  });

  const badgeStatus = (t) => {
    const s = STATUS_TAREA[t.status] || { label: t.status || "—", color: "b-gray" };
    const esAtrasada = t.fecha_fin && t.fecha_fin < today() && (t.porcentaje_avance || 0) < 100;
    if (esAtrasada) return <span className="badge b-amber" style={{ fontSize: 8 }}> Atrasada</span>;
    return <span className={`badge ${s.color}`} style={{ fontSize: 8 }}>{s.label}</span>;
  };

  const badgeSub = (s) => {
    const pct = s.porcentaje_avance || 0;
    const esAtrasada = s.fecha_fin && s.fecha_fin < today() && pct < 100;
    if (pct >= 100)   return <span className="badge b-green" style={{ fontSize: 8 }}>✓ Completa</span>;
    if (esAtrasada)   return <span className="badge b-amber" style={{ fontSize: 8 }}> Atrasada</span>;
    if (pct > 0)      return <span className="badge b-blue"  style={{ fontSize: 8 }}>{pct}%</span>;
    return               <span className="badge b-gray"  style={{ fontSize: 8 }}>Pendiente</span>;
  };

  return (
    <>
      <td
        className="resp-cell"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ padding: "7px 12px", background: "inherit" }}
      >
        <span className="resp-cell-name" title={resp}>
           {resp}
        </span>
      </td>
      {visible && pos && (
        <div
          className="resp-popover"
          style={{ top: pos.top, left: pos.left, pointerEvents: "auto" }}
          onMouseEnter={() => { clearTimeout(timerRef.current); setVisible(true); }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="resp-popover-hdr">
            <Glyph d={GLYPHS.persona} size={15} />
            <div className="resp-popover-hdr-name">{resp}</div>
            <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, opacity: .6 }}>
              {misTareas.length} tarea{misTareas.length !== 1 ? "s" : ""} · {misSubtareas.length} subtarea{misSubtareas.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="resp-popover-body">

            {/*  Tareas  */}
            {misTareas.length > 0 && (
              <>
                <div className="resp-pop-section">Tareas asignadas</div>
                {misTareas.map(t => (
                  <div key={t.id} className="resp-pop-row">
                    <div className="resp-pop-name">{t.nombre}</div>
                    <div className="resp-pop-badge">{badgeStatus(t)}</div>
                  </div>
                ))}
              </>
            )}

            {/*  Subtareas  */}
            {misSubtareas.length > 0 && (
              <>
                <div className="resp-pop-section">Subtareas asignadas</div>
                {misSubtareas.map(({ sub, tareaMadre }, i) => (
                  <React.Fragment key={sub.id || i}>
                    {/* Nombre de la tarea madre como contexto */}
                    <div style={{ fontSize: 9, color: "var(--muted2)", padding: "6px 0 2px", fontFamily: "var(--mono)", letterSpacing: .3 }}>
                      ↳ {tareaMadre.nombre}
                    </div>
                    <div className="resp-pop-sub-row">
                      <div className="resp-pop-sub-name">{sub.descripcion || sub.nombre || "—"}</div>
                      <div className="resp-pop-badge">{badgeSub(sub)}</div>
                    </div>
                  </React.Fragment>
                ))}
              </>
            )}

            {misTareas.length === 0 && misSubtareas.length === 0 && (
              <div className="resp-pop-empty">Sin tareas ni subtareas asignadas</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

//  REPORTE DE DESVÍOS 
// Muestra tabla por tarea/subtarea con días comprometidos, días reales, desvío,
// razón, owner y responsable. Aprende de la historia para estimar futuros proyectos.
function ReporteDesvios({ tareas }) {
  const [filtro, setFiltro] = useState("todas"); // "todas" | "demora" | "adelanto" | "ok"

  // Calcular días hábiles reales entre dos fechas (usando dias_habiles config de la tarea)
  const diasReales = (inicio, fin, diasHabiles) => {
    if (!inicio || !fin) return null;
    const dh = Array.isArray(diasHabiles) && diasHabiles.length === 7 ? diasHabiles : [...DIAS_DEFAULT];
    let cur = new Date(inicio + "T00:00:00");
    const end = new Date(fin + "T00:00:00");
    let count = 0;
    while (cur <= end) {
      const dow = (cur.getDay() + 6) % 7;
      if (dh[dow]) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Armar filas: tareas + subtareas aplanadas
  const filas = [];
  tareas.forEach(t => {
    const comprDias = parseInt(t.duracion_dias) || null;
    const realDias  = t.fecha_real_fin && t.fecha_inicio ? diasReales(t.fecha_inicio, t.fecha_real_fin, t.dias_habiles) : null;
    const desvio    = comprDias !== null && realDias !== null ? realDias - comprDias : null;
    filas.push({
      tipo: "tarea",
      nombre: t.nombre,
      owner: t.owner || "—",
      responsable: t.responsable || "—",
      fechaComprInicio: t.fecha_inicio,
      fechaComprFin: t.fecha_fin,
      fechaRealFin: t.fecha_real_fin || null,
      comprDias,
      realDias,
      desvio,
      razon: t.razon_desvio || "",
      pct: t.porcentaje_avance || 0,
    });
    (t.subtareas || []).forEach(s => {
      const sComprDias = s.fecha_inicio && s.fecha_fin ? diasReales(s.fecha_inicio, s.fecha_fin, t.dias_habiles) : null;
      const sRealDias  = s.fecha_real_fin && s.fecha_inicio ? diasReales(s.fecha_inicio, s.fecha_real_fin, t.dias_habiles) : null;
      const sDesvio    = sComprDias !== null && sRealDias !== null ? sRealDias - sComprDias : null;
      filas.push({
        tipo: "subtarea",
        nombre: `↳ ${s.descripcion}`,
        owner: t.owner || "—",
        responsable: s.responsable || t.responsable || "—",
        fechaComprInicio: s.fecha_inicio,
        fechaComprFin: s.fecha_fin,
        fechaRealFin: s.fecha_real_fin || null,
        comprDias: sComprDias,
        realDias: sRealDias,
        desvio: sDesvio,
        razon: s.razon_desvio || "",
        pct: s.porcentaje_avance || 0,
      });
    });
  });

  const filtradas = filas.filter(f => {
    if (filtro === "demora")   return f.desvio !== null && f.desvio > 0;
    if (filtro === "adelanto") return f.desvio !== null && f.desvio < 0;
    if (filtro === "ok")       return f.desvio !== null && f.desvio === 0;
    return true;
  });

  // Stats resumen
  const conDesvio   = filas.filter(f => f.desvio !== null);
  const totalDemora = conDesvio.filter(f => f.desvio > 0).reduce((a, f) => a + f.desvio, 0);
  const promDesvio  = conDesvio.length ? (conDesvio.reduce((a, f) => a + (f.desvio || 0), 0) / conDesvio.length).toFixed(1) : "—";
  const maxDemora   = conDesvio.length ? Math.max(...conDesvio.map(f => f.desvio)) : null;
  const conRazon    = filas.filter(f => f.razon?.trim()).length;

  const desvioColor = (d) => {
    if (d === null) return "var(--muted2)";
    if (d > 0) return "var(--danger)";
    if (d < 0) return "var(--accent2)";
    return "var(--muted)";
  };
  const desvioLabel = (d) => {
    if (d === null) return "—";
    if (d > 0) return `+${d}d `;
    if (d < 0) return `${d}d ✓`;
    return "0d ✓";
  };

  return (
    <div>
      {/* Stats resumen */}
      <div className="stats mb12">
        <div className="stat">
          <div className="stat-label">Tareas con datos reales</div>
          <div className="stat-value" style={{ color: "var(--blue)" }}>{conDesvio.length}<span style={{ fontSize: 12, color: "var(--muted)" }}>/{filas.length}</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Desvío promedio</div>
          <div className="stat-value" style={{ color: promDesvio > 0 ? "var(--danger)" : "var(--accent2)" }}>{promDesvio}<span style={{ fontSize: 12, color: "var(--muted)" }}> días</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">Mayor demora</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>{maxDemora !== null && maxDemora > 0 ? `+${maxDemora}d` : "—"}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Razones registradas</div>
          <div className="stat-value" style={{ color: "var(--muted)" }}>{conRazon}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-row mb12">
        {[["todas", "Todas"], ["demora", " Con demora"], ["adelanto", "✓ Adelantos"], ["ok", "= Sin desvío"]].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${filtro === v ? "btn-primary" : "btn-ghost"}`} onClick={() => setFiltro(v)}>{l}</button>
        ))}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtradas.length} filas</span>
      </div>

      {/* Info si faltan datos */}
      {conDesvio.length === 0 && (
        <div className="info-box accent mb12" style={{ fontSize: 12 }}>
          Completá el campo <strong>Fecha real de finalización</strong> en cada tarea/subtarea para ver el análisis de desvíos.
        </div>
      )}

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Tarea / Subtarea", "Owner", "Responsable", "Comprometido", "Inicio → Fin pactada", "Fin real", "Días comp.", "Días reales", "Desvío", "Razón"].map((h, i) => (
                <th key={i} style={{ padding: "7px 10px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "var(--muted)", letterSpacing: .5, textTransform: "uppercase", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0
              ? <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "var(--muted2)", fontSize: 12 }}>Sin filas para este filtro</td></tr>
              : filtradas.map((f, idx) => {
                  const bg = f.tipo === "subtarea" ? "var(--surface2)" : "#fff";
                  return (
                    <tr key={idx} style={{ background: bg, borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: f.tipo === "tarea" ? 700 : 500, color: f.tipo === "tarea" ? "var(--navy)" : "var(--mid)", fontSize: f.tipo === "subtarea" ? 10 : 11, maxWidth: 200, wordBreak: "break-word" }}>{f.nombre}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{f.owner}</td>
                      <td style={{ padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{f.responsable}</td>
                      <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{fmtDate(f.fechaComprFin)}</td>
                      <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{f.fechaComprInicio ? `${fmtDate(f.fechaComprInicio)} → ${fmtDate(f.fechaComprFin)}` : "—"}</td>
                      <td style={{ padding: "8px 10px", fontSize: 10, whiteSpace: "nowrap", fontWeight: f.fechaRealFin ? 600 : 400, color: f.fechaRealFin ? "var(--navy)" : "var(--muted2)" }}>{f.fechaRealFin ? fmtDate(f.fechaRealFin) : "—"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{f.comprDias ?? "—"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: f.realDias !== null ? "var(--navy)" : "var(--muted2)", fontWeight: f.realDias !== null ? 700 : 400 }}>{f.realDias ?? "—"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: desvioColor(f.desvio), whiteSpace: "nowrap" }}>{desvioLabel(f.desvio)}</td>
                      <td style={{ padding: "8px 10px", fontSize: 10, color: "var(--muted)", maxWidth: 220, wordBreak: "break-word" }}>{f.razon || <span style={{ color: "var(--muted2)", fontStyle: "italic" }}>—</span>}</td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Resumen por responsable */}
      {conDesvio.length > 0 && (() => {
        const porResp = {};
        filas.filter(f => f.desvio !== null).forEach(f => {
          const r = f.responsable || "Sin asignar";
          if (!porResp[r]) porResp[r] = { n: 0, totalDesvio: 0, demoras: 0, adelantos: 0 };
          porResp[r].n++;
          porResp[r].totalDesvio += f.desvio;
          if (f.desvio > 0) porResp[r].demoras++;
          if (f.desvio < 0) porResp[r].adelantos++;
        });
        const rows = Object.entries(porResp).sort((a, b) => b[1].totalDesvio - a[1].totalDesvio);
        return (
          <div className="card mt16" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              <div className="stat-label">Desvío acumulado por responsable</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--surface2)" }}>
                  {["Responsable", "Tareas evaluadas", "Desvío total (días)", "Con demora", "Con adelanto", "Promedio"].map((h, i) => (
                    <th key={i} style={{ padding: "6px 12px", textAlign: i > 0 ? "center" : "left", fontSize: 9, fontWeight: 700, color: "var(--muted)", letterSpacing: .5, textTransform: "uppercase", borderBottom: "2px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([resp, s], idx) => {
                  const prom = (s.totalDesvio / s.n).toFixed(1);
                  const bg = idx % 2 === 0 ? "#fff" : "var(--surface2)";
                  return (
                    <tr key={resp} style={{ background: bg, borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--navy)" }}>{resp}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)" }}>{s.n}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700, color: s.totalDesvio > 0 ? "var(--danger)" : s.totalDesvio < 0 ? "var(--accent2)" : "var(--muted)" }}>{s.totalDesvio > 0 ? `+${s.totalDesvio}` : s.totalDesvio}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", color: s.demoras > 0 ? "var(--danger)" : "var(--muted2)", fontWeight: s.demoras > 0 ? 700 : 400 }}>{s.demoras > 0 ? ` ${s.demoras}` : "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", color: s.adelantos > 0 ? "var(--accent2)" : "var(--muted2)", fontWeight: s.adelantos > 0 ? 700 : 400 }}>{s.adelantos > 0 ? `✓ ${s.adelantos}` : "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700, color: parseFloat(prom) > 0 ? "var(--danger)" : parseFloat(prom) < 0 ? "var(--accent2)" : "var(--muted)" }}>{parseFloat(prom) > 0 ? `+${prom}d` : `${prom}d`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}

//  PAGE PROYECTOS 
function PageProyectos({ onSelectProyecto, notify, filtroEmpresaExterno = "", soloAtrasados = false }) {
  const [proyectos, setProyectos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(null);
  const [modal, setModal]           = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState(filtroEmpresaExterno);
  const [filtroStatus, setFiltroStatus]   = useState("");
  const [eliminandoId, setEliminandoId]   = useState(null);
  const [confirmId, setConfirmId]         = useState(null);

  // C2: sincronizar filtro cuando cambia desde el sidebar
  useEffect(() => {
    setFiltroEmpresa(filtroEmpresaExterno);
  }, [filtroEmpresaExterno]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try { setProyectos(await api.getProyectos()); }
    catch (e) { setLoadError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = proyectos.filter(p => {
    if (filtroEmpresa && p.empresa !== filtroEmpresa) return false;
    if (filtroStatus  && p.status  !== filtroStatus)  return false;
    // C3: filtrar solo atrasados cuando corresponde
    if (soloAtrasados && !(p.status === "en_curso" && p.fecha_fin && p.fecha_fin < today())) return false;
    return true;
  });

  const handleEliminar = async (e, id) => {
    e.stopPropagation();
    if (confirmId !== id) { setConfirmId(id); return; }
    setEliminandoId(id);
    try {
      await api.eliminarProyecto(id);
      notify("Proyecto eliminado", "warn");
      setConfirmId(null);
      load();
    } catch (err) {
      notify("Error al eliminar: " + err.message, "error");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-label">Total</div><div className="stat-value" style={{ color: "var(--blue)" }}>{proyectos.length}</div></div>
        <div className="stat"><div className="stat-label">En curso</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{proyectos.filter(p => p.status === "en_curso").length}</div></div>
        <div className="stat"><div className="stat-label">Atrasados</div><div className="stat-value" style={{ color: "var(--danger)" }}>{proyectos.filter(p => p.status === "en_curso" && p.fecha_fin && p.fecha_fin < today()).length}</div></div>
        <div className="stat"><div className="stat-label">Completados</div><div className="stat-value" style={{ color: "var(--muted)" }}>{proyectos.filter(p => p.status === "completado").length}</div></div>
      </div>
      <div className="filter-row">
        <select className="filter-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {filtroStatus && <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroStatus(""); }}>✕ Limpiar</button>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtrados.length} proyectos</span>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Nuevo proyecto</button>
      </div>

      {loadError && <div className="info-box danger mb12" style={{ fontSize: 12 }}>Error cargando proyectos: {loadError}</div>}
      {loading
        ? <div className="loading"><span className="spin">◌</span> Cargando...</div>
        : filtrados.length === 0
          ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin proyectos</div>
          : filtrados.map(p => {
              const s      = STATUS_PROYECTO[p.status] || { label: p.status, color: "b-gray" };
              const tareas = p.proyecto_tareas || [];
              const pct    = tareas.length ? Math.round(tareas.reduce((a, t) => a + (t.porcentaje_avance || 0), 0) / tareas.length) : 0;
              const atrasada = p.status === "en_curso" && p.fecha_fin && p.fecha_fin < today();
              const esConfirm = confirmId === p.id;
              return (
                <div key={p.id} className={`req-row ${atrasada ? "active-border" : ""}`}
                  onClick={() => { if (confirmId === p.id) { setConfirmId(null); return; } onSelectProyecto(p); }}
                  style={{ position: "relative" }}>
                  {/* Nivel 1: Identificadores y estado */}
                  <div className="flex-gap mb8">
                    <span className={`badge ${s.color}`}>{s.label}</span>
                    <span className={`badge ${p.tipo === "externo" ? "b-purple" : "b-teal"}`}>{p.tipo}</span>
                    {atrasada && <span className="badge b-red"> Atrasado</span>}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)" }}>{p.empresa}</span>
                  </div>
                  {/* Nivel 2: Título */}
                  <div className="req-title">{p.nombre}</div>
                  {/* Nivel 3: Metadata */}
                  <div className="req-meta">
                    {p.cliente    && <span> {p.cliente}</span>}
                    {p.responsable && <><span>·</span><span> {p.responsable}</span></>}
                    {p.fecha_inicio && <><span>·</span><span>{fmtDate(p.fecha_inicio)} → {fmtDate(p.fecha_fin)}</span></>}
                    <span>·</span><span>{tareas.length} tareas</span>
                    {(p.proyecto_recursos || []).length > 0 && <><span>·</span><span>{(p.proyecto_recursos || []).map(r => r.nombre).join(", ")}</span></>}
                    {(p.proyecto_contactos || []).length > 0 && <><span>·</span><span> {(p.proyecto_contactos || []).map(c => c.nombre).join(", ")}</span></>}
                  </div>
                  {tareas.length > 0 && <div className="mt8"><PctBar pct={pct} /><div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 3 }}>{pct}% avance global</div></div>}
                  {/* Nivel 4: Acciones — DS §10.2 */}
                  <div className="req-row-actions" onClick={e => e.stopPropagation()}>
                    {!esConfirm ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={e => handleEliminar(e, p.id)}
                        disabled={eliminandoId === p.id}
                      >
                        {eliminandoId === p.id ? "..." : "✕ Eliminar"}
                      </button>
                    ) : (
                      <div className="flex-gap">
                        <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>¿Eliminar?</span>
                        <button className="btn btn-danger btn-sm" onClick={e => handleEliminar(e, p.id)} disabled={eliminandoId === p.id}>
                          {eliminandoId === p.id ? "..." : "Sí"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setConfirmId(null); }}>No</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
      }
      {modal && <ProyectoModal onClose={() => setModal(false)} onSave={() => { setModal(false); notify("Proyecto creado", "success"); load(); }} />}
    </div>
  );
}


//  ÍCONO POR TIPO DE ARCHIVO 
function FileIcon({ tipo, nombre }) {
  const ext = (nombre || "").split(".").pop().toLowerCase();
  // Badge con la extensión en texto: no depende de emoji ni de fuentes con soporte
  const MAPA = [
    { exts: ["pdf"], label: "PDF", color: "#C0392B" },
    { exts: ["xls", "xlsx", "csv"], label: "XLS", color: "#1E7A4A" },
    { exts: ["doc", "docx"], label: "DOC", color: "#235C96" },
    { exts: ["jpg", "jpeg", "png", "gif", "webp"], label: "IMG", color: "#B07D0A" },
    { exts: ["eml", "msg"], label: "MAIL", color: "#6381A7" },
  ];
  const m = MAPA.find(x => x.exts.includes(ext));
  const label = m ? m.label : (ext ? ext.slice(0, 4).toUpperCase() : "FILE");
  const color = m ? m.color : "var(--muted)";
  return (
    <span title={nombre || tipo || label} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, letterSpacing: ".04em",
      color, border: `1px solid ${color}`, borderRadius: 2,
      padding: "1px 3px", minWidth: 30, flexShrink: 0, lineHeight: 1.4,
    }}>{label}</span>
  );
}

function fmtTamanio(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

//  PANEL DE ADJUNTOS 
function AdjuntosPanel({ proyectoId, tareaId = null, notify }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const inputId = `adj-input-${proyectoId}-${tareaId || "proy"}`;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getAdjuntos(proyectoId);
      setAdjuntos(tareaId
        ? data.filter(a => a.tarea_id === tareaId)
        : data.filter(a => !a.tarea_id)
      );
    } catch (e) { setLoadError(e.message); }
    finally { setLoading(false); }
  }, [proyectoId, tareaId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await api.subirAdjunto(file, proyectoId, tareaId);
      }
      notify(`${files.length > 1 ? files.length + " archivos subidos" : "Archivo subido"}`, "success");
      load();
    } catch (e) {
      notify("Error al subir: " + e.message, "error");
    } finally { setUploading(false); }
  };

  const handleEliminar = async (adj) => {
    if (!window.confirm(`¿Eliminar "${adj.nombre}"?`)) return;
    setEliminandoId(adj.id);
    try {
      await api.eliminarAdjunto(adj.id, adj.url);
      notify("Adjunto eliminado", "warn");
      load();
    } catch (e) {
      notify("Error: " + e.message, "error");
    } finally { setEliminandoId(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Zona de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById(inputId).click()}
        style={{
          border: "2px dashed var(--border)", borderRadius: "var(--r2)",
          padding: "20px", textAlign: "center", cursor: "pointer",
          background: "var(--surface2)", transition: "all .15s", marginBottom: 12,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
      >
        <input
          id={inputId}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={e => handleUpload(e.target.files)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.eml,.msg,.txt"
        />
        {uploading
          ? <div style={{ fontSize: 12, color: "var(--muted)" }}><span className="spin" style={{ display: "inline-block" }}>◌</span> Subiendo...</div>
          : <div>
              <div style={{ fontSize: 22, marginBottom: 4 }}></div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Arrastrá archivos o hacé click para subir</div>
              <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>PDF, Word, Excel, imágenes, correos (.eml)</div>
            </div>
        }
      </div>

      {/* Lista de adjuntos */}
      {loadError
        ? <div style={{ fontSize: 12, color: "var(--danger)", padding: "8px 0" }}>Error: {loadError}</div>
        : loading
        ? <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Cargando...</div>
        : adjuntos.length === 0
          ? <div style={{ fontSize: 12, color: "var(--muted2)", padding: "4px 0" }}>Sin adjuntos</div>
          : adjuntos.map(adj => (
              <div key={adj.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: "var(--r)",
                marginBottom: 6, transition: "all .12s",
              }}>
                <FileIcon tipo={adj.tipo} nombre={adj.nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={adj.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {adj.nombre}
                  </a>
                  <div style={{ fontSize: 10, color: "var(--muted2)" }}>
                    {fmtTamanio(adj.tamanio)}{adj.created_at ? " · " + fmtDate(adj.created_at.slice(0,10)) : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleEliminar(adj)}
                  disabled={eliminandoId === adj.id}
                  style={{ background: "none", border: "none", color: "var(--muted2)", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted2)"}
                >
                  {eliminandoId === adj.id ? "..." : "✕"}
                </button>
              </div>
            ))
      }
    </div>
  );
}

//  TAB ADJUNTOS DE TAREAS 
function AdjuntosTareasTab({ proyectoId, tareas, notify }) {
  const [adjuntos, setAdjuntos] = useState([]);
  const [subtareasMap, setSubtareasMap] = useState({}); // tareaId -> subtareas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await api.getAdjuntos(proyectoId);
        setAdjuntos(data);
        const subs = {};
        await Promise.all(tareas.map(async t => {
          const s = await api.getSubtareas(t.id);
          subs[t.id] = s;
        }));
        setSubtareasMap(subs);
      } catch (e) {
        console.error("Error cargando adjuntos de tareas:", e.message);
      } finally { setLoading(false); }
    };
    cargar();
  // A2: solo proyectoId como dep — tareas es un array nuevo en cada render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  if (loading) return <div className="loading"><span className="spin">◌</span></div>;

  const adjPorTarea   = (tareaId) => adjuntos.filter(a => a.tarea_id === tareaId);
  const adjPorSub     = (subId)   => adjuntos.filter(a => a.tarea_id === subId);
  const tareasConAdj  = tareas.filter(t => adjPorTarea(t.id).length > 0 || (subtareasMap[t.id] || []).some(s => adjPorSub(s.id).length > 0));

  if (tareasConAdj.length === 0) return (
    <div className="empty-state">
      <div style={{ fontSize: 28, marginBottom: 8 }}></div>
      <div>Sin adjuntos en tareas ni subtareas</div>
      <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>Los adjuntos se agregan desde el modal de cada tarea → tab Adjuntos</div>
    </div>
  );

  return (
    <div>
      {tareasConAdj.map(t => {
        const adjsTarea = adjPorTarea(t.id);
        const subs = (subtareasMap[t.id] || []).filter(s => adjPorSub(s.id).length > 0);
        return (
          <div key={t.id} className="card" style={{ marginBottom: 12 }}>
            {/*  Header tarea  */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: adjsTarea.length > 0 || subs.length > 0 ? 12 : 0 }}>
              <span style={{ color: "var(--muted)" }}><Glyph d={GLYPHS.tarea} size={15} /></span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{t.nombre}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>
                  {t.owner && ` ${t.owner}`}{t.responsable && ` ·  ${t.responsable}`}
                  {t.fecha_inicio && ` · ${fmtDate(t.fecha_inicio)} → ${fmtDate(t.fecha_fin)}`}
                </div>
              </div>
            </div>

            {/*  Adjuntos de la tarea  */}
            {adjsTarea.length > 0 && (
              <div style={{ marginBottom: subs.length > 0 ? 12 : 0 }}>
                {adjsTarea.map(adj => (
                  <AdjuntoFila key={adj.id} adj={adj} proyectoId={proyectoId} notify={notify} onEliminar={() => setAdjuntos(prev => prev.filter(a => a.id !== adj.id))} />
                ))}
              </div>
            )}

            {/*  Subtareas con adjuntos  */}
            {subs.map(s => (
              <div key={s.id} style={{ marginLeft: 20, borderLeft: "2px solid var(--border)", paddingLeft: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>↳</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mid)" }}>{s.descripcion}</div>
                    {s.responsable && <div style={{ fontSize: 10, color: "var(--muted2)" }}> {s.responsable}</div>}
                  </div>
                </div>
                {adjPorSub(s.id).map(adj => (
                  <AdjuntoFila key={adj.id} adj={adj} proyectoId={proyectoId} notify={notify} onEliminar={() => setAdjuntos(prev => prev.filter(a => a.id !== adj.id))} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// Fila de adjunto reutilizable con eliminar
function AdjuntoFila({ adj, proyectoId, notify, onEliminar }) {
  const [eliminando, setEliminando] = useState(false);
  const handleEliminar = async () => {
    if (!window.confirm(`¿Eliminar "${adj.nombre}"?`)) return;
    setEliminando(true);
    try {
      await api.eliminarAdjunto(adj.id, adj.url);
      notify("Adjunto eliminado", "warn");
      onEliminar();
    } catch (e) { notify("Error: " + e.message, "error"); }
    finally { setEliminando(false); }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 5 }}>
      <FileIcon tipo={adj.tipo} nombre={adj.nombre} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={adj.url} target="_blank" rel="noreferrer"
          style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {adj.nombre}
        </a>
        <div style={{ fontSize: 10, color: "var(--muted2)" }}>{fmtTamanio(adj.tamanio)}{adj.created_at ? " · " + fmtDate(adj.created_at.slice(0,10)) : ""}</div>
      </div>
      <button onClick={handleEliminar} disabled={eliminando}
        style={{ background: "none", border: "none", color: "var(--muted2)", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--muted2)"}
      >{eliminando ? "..." : "✕"}</button>
    </div>
  );
}

//  FULLSCREEN WRAPPER 
function FullscreenWrapper({ title, onClose, children }) {
  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fullscreen-overlay">
      <div className="fs-topbar">
        <div className="fs-title"> {title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Modo presentación</div>
          <button className="fs-btn" onClick={onClose}>✕ Cerrar</button>
        </div>
      </div>
      <div className="fs-content">
        {children}
      </div>
    </div>
  );
}

//  PAGE DETALLE 
function PageDetalle({ proyectoId, onBack, notify }) {
  const [proyecto, setProyecto]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState(null);
  const [tab, setTab]                 = useState("gantt");
  const [modalMail, setModalMail]     = useState(false);
  const [modalTarea, setModalTarea]   = useState(null);
  const [editProyecto, setEditProyecto] = useState(false);
  const [fullscreen, setFullscreen]   = useState(null); // "gantt" | "detalle" | null
  const [tareasOrden, setTareasOrden]       = useState(null); // orden visual drag & drop
  const [tareasExpandidas, setTareasExpandidas] = useState({}); // id -> bool
  const [escalaGantt, setEscalaGantt] = useState("auto"); // "auto" | dia | semana | mes | trimestre | semestre
  const dragIdx = useRef(null);

  const toggleExpandir = (id, e) => {
    e.stopPropagation();
    setTareasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getProyectos();
      setProyecto(data.find(p => p.id === proyectoId));
    } catch (e) { setLoadError(e.message); }
    finally { setLoading(false); }
  }, [proyectoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading"><span className="spin">◌</span> Cargando...</div>;
  if (loadError) return <div className="info-box danger" style={{ margin: 24 }}>Error cargando proyecto: {loadError}</div>;
  if (!proyecto) return <div className="empty-state">Proyecto no encontrado</div>;

  const tareas   = proyecto.proyecto_tareas || [];
  const criticas = calcularCaminoCritico(tareas);
  const pct      = tareas.length ? Math.round(tareas.reduce((a, t) => a + (t.porcentaje_avance || 0), 0) / tareas.length) : 0;
  const atrasadas = tareas.filter(t => t.fecha_fin && t.fecha_fin < today() && t.porcentaje_avance < 100);
  const tareasOrdenadas = tareasOrden || tareas;

  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const arr = [...tareasOrdenadas];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    dragIdx.current = i;
    setTareasOrden(arr);
  };
  const handleDragEnd = () => { dragIdx.current = null; };

  const fechas   = tareas.filter(t => t.fecha_inicio && t.fecha_fin);
  const minFecha = fechas.length ? fechas.reduce((a, t) => t.fecha_inicio < a ? t.fecha_inicio : a, fechas[0].fecha_inicio) : proyecto.fecha_inicio;
  const maxFecha = fechas.length ? fechas.reduce((a, t) => t.fecha_fin   > a ? t.fecha_fin   : a, fechas[0].fecha_fin)   : proyecto.fecha_fin;
  const totalDias = minFecha && maxFecha ? Math.max(diffDays(minFecha, maxFecha), 1) : 90;

  const getBarStyle = (t) => {
    if (!t.fecha_inicio || !t.fecha_fin || !minFecha) return null;
    const left  = (diffDays(minFecha, t.fecha_inicio) / totalDias) * 100;
    const width = Math.max((diffDays(t.fecha_inicio, t.fecha_fin) / totalDias) * 100, 2);
    return { left: `${left}%`, width: `${width}%` };
  };

  // Línea de progreso dinámica debajo de la barra
  // Abierta: crece hasta today() — gris en tiempo, roja si atrasada, sin tick
  // Cerrada: congelada en fecha_real_fin — verde si en plazo o antes, roja si demoró, con tick
  const getLineaProgreso = (t, barStyleObj) => {
    if (!t.fecha_inicio || !t.fecha_fin || !minFecha || !barStyleObj) return null;
    const td = today();
    const comprLeftPct  = (diffDays(minFecha, t.fecha_inicio) / totalDias) * 100;
    const comprRightPct = comprLeftPct + Math.max((diffDays(t.fecha_inicio, t.fecha_fin) / totalDias) * 100, 2);
    if (t.fecha_real_fin) {
      const realRightPct = comprLeftPct + Math.max((diffDays(t.fecha_inicio, t.fecha_real_fin) / totalDias) * 100, 2);
      const isClosedLate = t.fecha_real_fin > t.fecha_fin;
      const color = isClosedLate ? "#E24B4A" : "#4A9C5D";
      const diffD = diffDays(t.fecha_fin, t.fecha_real_fin);
      const label = isClosedLate ? `+${diffD}d` : (diffD < 0 ? `${diffD}d` : "en plazo");
      // Label siempre a la derecha del fin de barra planeada para evitar que quede dentro
      const labelAnchorPct = Math.max(realRightPct, comprRightPct);
      return {
        lineLeft: `${comprLeftPct}%`, lineWidth: `${realRightPct - comprLeftPct}%`,
        lineColor: color, tickColor: color,
        tickLeft: `${realRightPct}%`,
        labelLeft: `calc(${labelAnchorPct}% + 5px)`,
        showTick: true, label, labelColor: isClosedLate ? "#C0392B" : "#1E7A4A",
      };
    } else {
      if (td < t.fecha_inicio) return null;
      const lineEndPct = comprLeftPct + Math.max((diffDays(t.fecha_inicio, td) / totalDias) * 100, 0);
      const color = td > t.fecha_fin ? "#E24B4A" : "#888780";
      return { lineLeft: `${comprLeftPct}%`, lineWidth: `${lineEndPct - comprLeftPct}%`, lineColor: color, tickColor: color, showTick: false, tickLeft: null, label: null };
    }
  };

  const getBarClass = (t) => {
    if (t.porcentaje_avance >= 100) return "done";
    if (criticas.has(t.id))         return "critical";
    if (t.fecha_fin && t.fecha_fin < today()) return "late";
    return "normal";
  };

  //  ESCALA ADAPTATIVA DEL EJE DE TIEMPO 
  // La unidad se elige según el span total del proyecto: con una tarea de 600+ días
  // la escala mensual genera 30+ columnas y el eje se vuelve ilegible, por eso se
  // degrada a trimestres / semestres. El usuario puede forzar la unidad con el selector.
  const escalaAuto = ESCALAS.find(e => totalDias <= e.maxDias) || ESCALAS[ESCALAS.length - 1];
  const escala = escalaGantt === "auto"
    ? escalaAuto
    : (ESCALAS.find(e => e.id === escalaGantt) || escalaAuto);

  // Períodos con su ancho REAL en días. Al ponderar las columnas por días (y no
  // repartirlas en partes iguales) las barras, que se posicionan en % sobre el span
  // total, quedan alineadas con el encabezado.
  const periodos = [];
  if (minFecha && maxFecha) {
    const D = 86400000;
    const startMs = new Date(minFecha).getTime();
    const endMs   = startMs + totalDias * D;
    if (Number.isFinite(startMs) && endMs > startMs) {
      let cur = bucketStart(startMs, escala.id);
      let guard = 0;
      while (cur < endMs && guard < 500) {
        const next  = bucketNext(cur, escala.id);
        if (!(next > cur)) break;
        const desde = Math.max(cur, startMs);
        const hasta = Math.min(next, endMs);
        periodos.push({ label: bucketLabel(cur, escala.id), dias: Math.max((hasta - desde) / D, 0.01) });
        cur = next;
        guard++;
      }
    }
  }

  // Columna de tareas 220px + columnas de tiempo. El mínimo en px por período evita
  // que las etiquetas se corten; el área de barras nunca baja de 640px para que los
  // labels de fecha real (que caen fuera de la barra) sigan siendo legibles.
  const anchoBarras = Math.max(periodos.length * escala.minPx, 640);
  const pxPorDia    = totalDias > 0 ? anchoBarras / totalDias : 1;
  const cols = periodos.length > 0
    ? `220px ${periodos.map(p => `minmax(${Math.max(Math.round(p.dias * pxPorDia), 10)}px, ${p.dias.toFixed(3)}fr)`).join(" ")}`
    : "220px minmax(640px,1fr)";

  const handleEliminarTarea = async (id) => {
    try {
      await api.eliminarTarea(id);
      setModalTarea(null);
      notify("Tarea eliminada", "warn");
      load();
    } catch (e) { notify("Error: " + e.message, "error"); }
  };

  return (
    <div>
      <div className="flex-gap mb12" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Volver</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditProyecto(true)}> Editar</button>
        <button className="btn btn-primary btn-sm" onClick={() => setModalTarea({})}>+ Nueva tarea</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setFullscreen("detalle")} style={{ marginLeft: "auto" }} title="Modo presentación"> Presentación</button>
      </div>

      <div className="card mb12">
        <div className="flex-between">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{proyecto.nombre}</div>
            <div className="flex-gap">
              <span className={`badge ${STATUS_PROYECTO[proyecto.status]?.color || "b-gray"}`}>{STATUS_PROYECTO[proyecto.status]?.label}</span>
              <span className={`badge ${proyecto.tipo === "externo" ? "b-purple" : "b-teal"}`}>{proyecto.tipo}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{proyecto.empresa}</span>
              {proyecto.cliente    && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {proyecto.cliente}</span>}
              {proyecto.responsable && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {proyecto.responsable}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 600, color: "var(--blue)" }}>{pct}%</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>avance global</div>
          </div>
        </div>
        {(proyecto.proyecto_recursos || []).length > 0 && (
          <div className="flex-gap mt8">{(proyecto.proyecto_recursos || []).map((r, i) => <div key={i} className="recurso-tag">{r.nombre}</div>)}</div>
        )}
        {proyecto.descripcion && <div className="info-box mt8" style={{ fontSize: 12 }}>{proyecto.descripcion}</div>}
        {(proyecto.proyecto_contactos || []).length > 0 && (
          <div className="mt8" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(proyecto.proyecto_contactos || []).map((c, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 10px", fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: "var(--navy)" }}>{c.nombre}</span>
                {c.email && <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} style={{ color: "var(--blue)", fontSize: 10 }}>{c.email}</a>}
              </div>
            ))}
          </div>
        )}
        <div className="mt8"><PctBar pct={pct} /></div>
      </div>

      {(() => {
        // Calcular subtareas y stats por responsable
        const todasSubtareas = tareas.flatMap(t => t.subtareas || []);
        const subPendientes  = todasSubtareas.filter(s => (s.porcentaje_avance || 0) === 0).length;
        const subEnCurso     = todasSubtareas.filter(s => (s.porcentaje_avance || 0) > 0 && (s.porcentaje_avance || 0) < 100).length;
        const subCompletadas = todasSubtareas.filter(s => (s.porcentaje_avance || 0) >= 100).length;

        // Agrupar tareas por responsable
        const porResponsable = {};
        tareas.forEach(t => {
          const r = t.responsable || "Sin asignar";
          if (!porResponsable[r]) porResponsable[r] = { pendientes: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
          const esAtrasada = t.fecha_fin && t.fecha_fin < today() && (t.porcentaje_avance || 0) < 100;
          if ((t.porcentaje_avance || 0) >= 100)     porResponsable[r].completadas++;
          else if (esAtrasada)                        porResponsable[r].atrasadas++;
          else if ((t.porcentaje_avance || 0) > 0)   porResponsable[r].en_curso++;
          else                                        porResponsable[r].pendientes++;
        });

        // Agrupar SUBTAREAS por su propio responsable (no el de la tarea madre)
        const subsPorResponsable = {};
        tareas.forEach(t => {
          (t.subtareas || []).forEach(s => {
            // Si la subtarea no tiene responsable propio, hereda el de la tarea madre
            const r = s.responsable || t.responsable || "Sin asignar";
            if (!subsPorResponsable[r]) subsPorResponsable[r] = { total: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
            subsPorResponsable[r].total++;
            const esAtrasadaSub = s.fecha_fin && s.fecha_fin < today() && (s.porcentaje_avance || 0) < 100;
            if ((s.porcentaje_avance || 0) >= 100)   subsPorResponsable[r].completadas++;
            else if (esAtrasadaSub)                   subsPorResponsable[r].atrasadas++;
            else if ((s.porcentaje_avance || 0) > 0) subsPorResponsable[r].en_curso++;
          });
        });

        // Unión de responsables (pueden aparecer solo en subtareas)
        const todosResponsables = Array.from(new Set([
          ...Object.keys(porResponsable),
          ...Object.keys(subsPorResponsable),
        ])).sort((a, b) => a === "Sin asignar" ? 1 : b === "Sin asignar" ? -1 : a.localeCompare(b));

        return (
          <>
            {/* Fila 1: stats principales */}
            <div className="stats">
              <div className="stat"><div className="stat-label">Tareas</div><div className="stat-value" style={{ color: "var(--blue)" }}>{tareas.length}</div></div>
              <div className="stat"><div className="stat-label">Completadas</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{tareas.filter(t => t.porcentaje_avance >= 100).length}</div></div>
              <div className="stat"><div className="stat-label">Atrasadas</div><div className="stat-value" style={{ color: "var(--danger)" }}>{atrasadas.length}</div></div>
              <div className="stat"><div className="stat-label">Camino crítico</div><div className="stat-value" style={{ color: "var(--warn)" }}>{criticas.size}</div></div>
            </div>

            {/* Fila 2: subtareas full width */}
            <div className="stats" style={{ marginBottom: 12 }}>
              <div className="stat">
                <div className="stat-label">Subtareas total</div>
                <div className="stat-value" style={{ color: "var(--navy)" }}>{todasSubtareas.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Pendientes</div>
                <div className="stat-value" style={{ color: "var(--muted)" }}>{subPendientes}</div>
              </div>
              <div className="stat">
                <div className="stat-label">En curso</div>
                <div className="stat-value" style={{ color: "var(--blue)" }}>{subEnCurso}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Completadas</div>
                <div className="stat-value" style={{ color: "var(--accent2)" }}>{subCompletadas}</div>
              </div>
            </div>

            {/* Fila 3: tabla responsables full width */}
            <div style={{ marginBottom: 18 }}>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  <div className="stat-label">Tareas y subtareas por responsable de ejecución</div>
                </div>
                {todosResponsables.length === 0
                  ? <div style={{ fontSize: 11, color: "var(--muted2)", padding: 14 }}>Sin responsables asignados</div>
                  : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "var(--surface2)" }}>
                          <th style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>Responsable</th>
                          <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }} colSpan={4}>— Tareas —</th>
                          <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", borderLeft: "2px solid var(--border)" }} colSpan={4}>— Subtareas —</th>
                        </tr>
                        <tr style={{ background: "var(--surface2)" }}>
                          <th style={{ padding: "4px 12px", borderBottom: "2px solid var(--border)" }}></th>
                          {["Total","En curso","Complet.","Atras.","Total","En curso","Complet.","Atras."].map((h, i) => (
                            <th key={i} style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted2)", fontSize: 9, letterSpacing: .3, textTransform: "uppercase", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap", borderLeft: i === 4 ? "2px solid var(--border)" : "none" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {todosResponsables.map((resp, idx) => {
                          const s     = porResponsable[resp]     || { pendientes: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
                          const sSubs = subsPorResponsable[resp] || { total: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
                          const tareaTotal = s.pendientes + s.en_curso + s.completadas + s.atrasadas;
                          const rowBg = idx % 2 === 0 ? "#fff" : "var(--surface2)";
                          const cell = (val, color) => (
                            <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: val > 0 ? 700 : 400, color: val > 0 ? color : "var(--muted2)", background: rowBg }}>
                              {val > 0 ? val : "—"}
                            </td>
                          );
                          return (
                            <tr key={resp} style={{ background: rowBg }}>
                              <ResponsablePopover resp={resp} tareas={tareas} today={today} />
                              {cell(tareaTotal, "var(--navy)")}
                              {cell(s.en_curso, "var(--blue)")}
                              {cell(s.completadas, "var(--accent2)")}
                              <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: s.atrasadas > 0 ? 700 : 400, color: s.atrasadas > 0 ? "var(--danger)" : "var(--muted2)", background: rowBg }}>
                                {s.atrasadas > 0 ? ` ${s.atrasadas}` : "—"}
                              </td>
                              <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: sSubs.total > 0 ? 700 : 400, color: "var(--navy)", background: rowBg, borderLeft: "2px solid var(--border)" }}>
                                {sSubs.total > 0 ? sSubs.total : "—"}
                              </td>
                              {cell(sSubs.en_curso, "var(--blue)")}
                              {cell(sSubs.completadas, "var(--accent2)")}
                              <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: sSubs.atrasadas > 0 ? 700 : 400, color: sSubs.atrasadas > 0 ? "var(--danger)" : "var(--muted2)", background: rowBg }}>
                                {sSubs.atrasadas > 0 ? ` ${sSubs.atrasadas}` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                }
              </div>
            </div>
          </>
        );
      })()}

      <div className="tabs-row" style={{ alignItems: "center" }}>
        {[{ id: "gantt", label: "Gantt" }, { id: "lista", label: "Lista de tareas" }, { id: "critico", label: "Camino crítico" }, { id: "desvios", label: " Reporte desvíos" }, { id: "adjuntos", label: " Adjuntos" }, { id: "adjuntos_tareas", label: " Adjuntos de tareas" }].map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>
        ))}
        {tab === "gantt" && (
          <div style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>
              Escala
              <select
                value={escalaGantt}
                onChange={e => setEscalaGantt(e.target.value)}
                title="Unidad del eje de tiempo"
                style={{ height: 28, padding: "0 8px", fontFamily: "var(--sans)", fontSize: 13, color: "var(--text)", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r)", outline: "none", cursor: "pointer" }}
              >
                <option value="auto">Auto ({escalaAuto.label.toLowerCase()})</option>
                {ESCALAS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </label>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setModalMail(true)}
              style={{ marginBottom: 2 }}
              title="Generar listado para mail"
            > Generar mail</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFullscreen("gantt")}
              style={{ marginBottom: 2 }}
              title="Ver Gantt en pantalla completa"
            > Ampliar Gantt</button>
          </div>
        )}
      </div>

      {tab === "gantt" && (
        <div className="gantt-wrap">
          <div className="gantt-scroll">
          <div className="gantt-inner">
          <div className="gantt-header" style={{ gridTemplateColumns: cols }}>
            <div className="gh-cell" style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>Tarea</div>
            {periodos.map((p, i) => <div key={i} className="gh-cell">{p.label}</div>)}
            {periodos.length === 0 && <div className="gh-cell">Línea de tiempo</div>}
          </div>
          {tareasOrdenadas.length === 0
            ? <div className="empty-state">Sin tareas — usá "+ Nueva tarea" para empezar</div>
            : tareasOrdenadas.map((t, i) => {
                const barStyle = getBarStyle(t);
                const subtareas = t.subtareas || [];
                return (
                  <React.Fragment key={t.id}>
                    {/*  Fila tarea madre  */}
                    <div
                      className="gantt-row"
                      style={{ gridTemplateColumns: cols, cursor: "grab", background: "#DBEAFE" }}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setModalTarea({ ...t, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre })}
                    >
                      <div className="gc-label">
                        {/* Fila superior: drag + expand en la misma línea */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                          <span style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }} title="Arrastrá para reordenar">⠿</span>
                          {subtareas.length > 0 && (
                            <span
                              onClick={e => toggleExpandir(t.id, e)}
                              title={tareasExpandidas[t.id] ? "Contraer subtareas" : "Expandir subtareas"}
                              style={{ color: "var(--blue)", fontSize: 10, cursor: "pointer", flexShrink: 0, userSelect: "none" }}
                            >
                              <Glyph d={tareasExpandidas[t.id] ? GLYPHS.chevronD : GLYPHS.chevronR} size={12} />
                            </span>
                          )}
                          {subtareas.length > 0 && <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--mono)" }}>{subtareas.length} sub</span>}
                          {criticas.has(t.id) && <span className="cc-badge">CC</span>}
                        </div>
                        {/* Nombre con wrap */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3, wordBreak: "break-word" }}>
                          {t.nombre}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.owner ? ` ${t.owner}` : t.responsable || "—"} · {t.duracion_dias}d · {t.porcentaje_avance || 0}%</div>
                      </div>
                      <div className="gc-bars" style={{ gridColumn: `2 / ${periodos.length + 2}`, background: "#fff" }}>
                        {barStyle ? (
                          <>
                            <div className={`bar ${getBarClass(t)}`} style={barStyle} />
                            {(() => {
                              const lp = getLineaProgreso(t, barStyle);
                              if (!lp) return null;
                              return (
                                <>
                                  <div className="bar-underline" style={{ left: lp.lineLeft, width: lp.lineWidth, background: lp.lineColor }} />
                                  {lp.showTick && <>
                                    <div className="bar-tick" style={{ left: lp.tickLeft, marginLeft: -1, background: lp.tickColor }} />
                                    <div className="bar-real-label" style={{ left: lp.labelLeft, color: lp.labelColor }}>{lp.label}</div>
                                  </>}
                                </>
                              );
                            })()}
                          </>
                        ) : <div style={{ fontSize: 10, color: "var(--muted2)", padding: "0 12px" }}>Sin fechas</div>}
                      </div>
                    </div>
                    {/*  Filas subtareas (solo si expandida)  */}
                    {tareasExpandidas[t.id] && subtareas.map(s => {
                      const sLeft  = s.fecha_inicio && minFecha ? (diffDays(minFecha, s.fecha_inicio) / totalDias) * 100 : null;
                      const sWidth = s.fecha_inicio && s.fecha_fin ? Math.max((diffDays(s.fecha_inicio, s.fecha_fin) / totalDias) * 100, 1) : null;
                      const sStyle = sLeft !== null && sWidth !== null ? { left: `${sLeft}%`, width: `${sWidth}%` } : null;
                      return (
                        <div
                          key={s.id}
                          className="gantt-row"
                          style={{ gridTemplateColumns: cols, background: "#F0F4F8", cursor: "pointer" }}
                          onClick={e => { e.stopPropagation(); setModalTarea({ ...t, _openSubtarea: s, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre }); }}
                        >
                          <div className="gc-label">
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↳ {s.descripcion}</div>
                            <div style={{ fontSize: 9, color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.responsable || "—"} · {s.porcentaje_avance || 0}%</div>
                          </div>
                          <div className="gc-bars" style={{ gridColumn: `2 / ${periodos.length + 2}` }}>
                            {sStyle ? (
                              <>
                                <div style={{
                                  ...sStyle, position: "absolute", height: 10, borderRadius: 3,
                                  background: s.porcentaje_avance >= 100
                                    ? "repeating-linear-gradient(45deg,rgba(30,122,74,0.55) 0px,rgba(30,122,74,0.55) 2px,#9EB3C8 2px,#9EB3C8 6px)"
                                    : "#B8C8D8",
                                  border: s.porcentaje_avance >= 100 ? "1px solid rgba(30,122,74,0.7)" : "none",
                                }} />
                                {(() => {
                                  if (!s.fecha_inicio || !s.fecha_fin || !minFecha || sLeft === null) return null;
                                  const td = today();
                                  if (s.fecha_real_fin) {
                                    const sRealRightPct = sLeft + Math.max((diffDays(s.fecha_inicio, s.fecha_real_fin) / totalDias) * 100, 1);
                                    const isLate = s.fecha_real_fin > s.fecha_fin;
                                    const lc = isLate ? "#E24B4A" : "#4A9C5D";
                                    const diffD = diffDays(s.fecha_fin, s.fecha_real_fin);
                                    const label = isLate ? `+${diffD}d` : (diffD < 0 ? `${diffD}d` : "✓");
                                    return (<>
                                      <div style={{ position:"absolute", left:`${sLeft}%`, width:`${sRealRightPct - sLeft}%`, height:2, background:lc, top:28, borderRadius:2 }} />
                                      <div style={{ position:"absolute", left:`${sRealRightPct}%`, marginLeft:-1, width:2, height:10, background:lc, top:23, borderRadius:1 }} />
                                      <div style={{ position:"absolute", left:`calc(${sRealRightPct}% + 4px)`, top:8, fontSize:7, fontWeight:600, color:isLate?"#C0392B":"#1E7A4A", fontFamily:"var(--mono)", whiteSpace:"nowrap" }}>{label}</div>
                                    </>);
                                  } else {
                                    if (td < s.fecha_inicio) return null;
                                    const sEndPct = sLeft + Math.max((diffDays(s.fecha_inicio, td) / totalDias) * 100, 0);
                                    const color = td > s.fecha_fin ? "#E24B4A" : "#888780";
                                    return <div style={{ position:"absolute", left:`${sLeft}%`, width:`${sEndPct - sLeft}%`, height:2, background:color, top:28, borderRadius:2 }} />;
                                  }
                                })()}
                              </>
                            ) : <div style={{ fontSize: 9, color: "var(--muted2)", padding: "0 12px" }}>Sin fechas</div>}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })
          }
          </div>{/* gantt-inner */}
          </div>{/* gantt-scroll */}
          <div style={{ padding: "10px 16px", display: "flex", gap: 14, borderTop: "1px solid var(--border)", background: "var(--surface2)", flexWrap: "wrap", alignItems: "center" }}>
            {[["var(--danger)", "Camino crítico"], ["#9EB3C8", "En tiempo / en curso"]].map(([color, label]) => (
              <div key={label} className="flex-gap"><div style={{ width: 10, height: 10, borderRadius: 2, background: color }} /><span style={{ fontSize: 9, color: "var(--muted)" }}>{label}</span></div>
            ))}
            <div className="flex-gap">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "repeating-linear-gradient(45deg,rgba(30,122,74,0.55) 0px,rgba(30,122,74,0.55) 3px,#9EB3C8 3px,#9EB3C8 8px)", border: "1px solid rgba(30,122,74,0.7)" }} />
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Completada</span>
            </div>
            <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative", width: 22, height: 10 }}>
                <div style={{ position: "absolute", left: 0, width: 14, height: 2, background: "#4A9C5D", borderRadius: 2, top: 4 }} />
                <div style={{ position: "absolute", left: 11, width: 2, height: 8, background: "#4A9C5D", borderRadius: 1, top: 1 }} />
              </div>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Cerrada en plazo o antes</span>
            </div>
            <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative", width: 30, height: 10 }}>
                <div style={{ position: "absolute", left: 0, width: 26, height: 2, background: "#E24B4A", borderRadius: 2, top: 4 }} />
                <div style={{ position: "absolute", left: 23, width: 2, height: 8, background: "#E24B4A", borderRadius: 1, top: 1 }} />
              </div>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Cerrada con demora</span>
            </div>
            <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
              <div style={{ width: 22, height: 2, background: "#888780", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Progreso en tiempo</span>
            </div>
            <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
              <div style={{ width: 22, height: 2, background: "#E24B4A", borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: "var(--muted)" }}>Progreso atrasado</span>
            </div>
            {tareasOrden && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setTareasOrden(null)}>↺ Restablecer orden</button>
            )}
          </div>
        </div>
      )}

      {tab === "lista" && (
        <div>
          {tareas.length === 0 ? <div className="empty-state">Sin tareas</div> :
            tareas.map(t => {
              const s = STATUS_TAREA[t.status] || { label: t.status, color: "b-gray" };
              const esAtrasada = t.fecha_fin && t.fecha_fin < today() && t.porcentaje_avance < 100;
              return (
                <div key={t.id} className={`tarea-row ${criticas.has(t.id) ? "critica" : esAtrasada ? "atrasada" : ""}`} onClick={() => setModalTarea({ ...t, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre })}>
                  <div className="flex-between mb8">
                    <div className="flex-gap">
                      <span className={`badge ${s.color}`}>{s.label}</span>
                      {criticas.has(t.id) && <span className="badge b-red">CC</span>}
                      {esAtrasada && <span className="badge b-amber"> Atrasada</span>}
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{t.porcentaje_avance || 0}%</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)", marginBottom: 6 }}>{t.nombre}</div>
                  <div className="req-meta">
                    {t.owner && <span> {t.owner}</span>}
                    {t.responsable && <><span>·</span><span> {t.responsable}</span></>}
                    {t.fecha_inicio && <><span>·</span><span>{fmtDate(t.fecha_inicio)} → {fmtDate(t.fecha_fin)}</span></>}
                    <span>·</span><span>{t.duracion_dias} días hábiles</span>
                    {(t.dependencias || []).length > 0 && <><span>·</span><span>{t.dependencias.length} dep.</span></>}
                  </div>
                  <div className="mt8"><PctBar pct={t.porcentaje_avance || 0} critica={criticas.has(t.id)} /></div>
                </div>
              );
            })
          }
        </div>
      )}

      {tab === "critico" && (
        <div>
          <div className="info-box danger mb12" style={{ fontSize: 12 }}>
            Las tareas del camino crítico determinan la duración mínima del proyecto. Un atraso en cualquiera de estas tareas atrasa el proyecto completo.
          </div>
          {criticas.size === 0
            ? <div className="empty-state">Agregá tareas con fechas y dependencias para calcular el camino crítico</div>
            : tareas.filter(t => criticas.has(t.id)).map(t => {
                const esAtrasada = t.fecha_fin && t.fecha_fin < today() && t.porcentaje_avance < 100;
                return (
                  <div key={t.id} className="tarea-row critica" onClick={() => setModalTarea({ ...t, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre })}>
                    <div className="flex-between mb8">
                      <div className="flex-gap">
                        <span className="badge b-red">Camino crítico</span>
                        {esAtrasada && <span className="badge b-amber"> Atrasada</span>}
                      </div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{t.porcentaje_avance || 0}%</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)", marginBottom: 6 }}>{t.nombre}</div>
                    <div className="req-meta">
                      {t.responsable && <span>{t.responsable}</span>}
                      {t.fecha_inicio && <><span>·</span><span>{fmtDate(t.fecha_inicio)} → {fmtDate(t.fecha_fin)}</span></>}
                      <span>·</span><span>{t.duracion_dias} días hábiles</span>
                    </div>
                    <div className="mt8"><PctBar pct={t.porcentaje_avance || 0} critica /></div>
                  </div>
                );
              })
          }
        </div>
      )}

      {tab === "adjuntos" && (
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Adjuntos del proyecto</div>
          <AdjuntosPanel proyectoId={proyectoId} notify={notify} />
        </div>
      )}

      {tab === "desvios" && (
        <ReporteDesvios tareas={tareas} />
      )}

      {modalMail && (() => {
        const fmtFecha = (d) => d ? new Date(d+'T00:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
        const lineas = []
        tareasOrdenadas.forEach(t => {
          const resp = t.responsable || 'Sin asignar'
          const fi = fmtFecha(t.fecha_inicio)
          const ff = fmtFecha(t.fecha_fin)
          lineas.push(`• ${t.nombre} [${fi} - ${ff}] ${resp}`)
          ;(t.subtareas||[]).forEach(s => {
            const sr = s.responsable || resp
            const sfi = fmtFecha(s.fecha_inicio)
            const sff = fmtFecha(s.fecha_fin)
            lineas.push(`    ${s.nombre} [${sfi} - ${sff}] ${sr}`)
          })
        })
        const texto = lineas.join('\n')
        return (
          <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModalMail(false)}>
            <div className="modal">
              <div className="mhdr">
                <div className="mtitle"> Listado de tareas para mail</div>
                <button className="mclose" onClick={()=>setModalMail(false)}>✕</button>
              </div>
              <div className="mbody">
                <textarea
                  readOnly
                  value={texto}
                  style={{width:'100%',minHeight:320,fontFamily:'var(--mono)',fontSize:12,border:'1px solid var(--border)',borderRadius:'var(--r)',padding:12,resize:'vertical',background:'var(--surface2)',lineHeight:1.7,outline:'none'}}
                />
              </div>
              <div className="mftr">
                <button className="btn btn-ghost" onClick={()=>setModalMail(false)}>Cerrar</button>
                <button className="btn btn-primary" onClick={()=>{navigator.clipboard.writeText(texto);alert('¡Copiado al portapapeles!')}}> Copiar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {tab === "adjuntos_tareas" && (
        <AdjuntosTareasTab proyectoId={proyectoId} tareas={tareas} notify={notify} />
      )}

      {modalTarea !== null && (
        <TareaModal
          tarea={modalTarea?.id ? modalTarea : null}
          proyectoId={proyectoId}
          tareas={tareas}
          onClose={() => setModalTarea(null)}
          onSave={() => { setModalTarea(null); notify("Tarea guardada", "success"); load(); }}
          onEliminar={handleEliminarTarea}
          notify={notify}
        />
      )}
      {editProyecto && (
        <ProyectoModal
          proyecto={proyecto}
          onClose={() => setEditProyecto(false)}
          onSave={() => { setEditProyecto(false); notify("Proyecto actualizado", "success"); load(); }}
        />
      )}

      {/*  FULLSCREEN GANTT  */}
      {fullscreen === "gantt" && (
        <FullscreenWrapper title={`Gantt — ${proyecto.nombre}`} onClose={() => setFullscreen(null)}>
          <div className="gantt-wrap">
            <div className="gantt-scroll">
            <div className="gantt-inner">
            <div className="gantt-header" style={{ gridTemplateColumns: cols }}>
              <div className="gh-cell" style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>Tarea</div>
              {periodos.map((p, i) => <div key={i} className="gh-cell">{p.label}</div>)}
              {periodos.length === 0 && <div className="gh-cell">Línea de tiempo</div>}
            </div>
            {tareas.length === 0
              ? <div className="empty-state">Sin tareas</div>
              : tareas.map(t => {
                  const barStyle = getBarStyle(t);
                  return (
                    <div
                      key={t.id}
                      className="gantt-row"
                      style={{ gridTemplateColumns: cols, cursor: "pointer" }}
                      onClick={() => setModalTarea({ ...t, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre })}
                    >
                      <div className="gc-label">
                        <div className="gc-name">{t.nombre}{criticas.has(t.id) && <span className="cc-badge">CC</span>}</div>
                        <div className="gc-sub">{t.owner ? ` ${t.owner}` : t.responsable || "—"} · {t.duracion_dias}d · {t.porcentaje_avance || 0}%</div>
                      </div>
                      <div className="gc-bars" style={{ gridColumn: `2 / ${periodos.length + 2}`, background: "#fff" }}>
                        {barStyle ? (
                          <>
                            <div className={`bar ${getBarClass(t)}`} style={barStyle} />
                            {(() => {
                              const lp = getLineaProgreso(t, barStyle);
                              if (!lp) return null;
                              return (<>
                                <div className="bar-underline" style={{ left: lp.lineLeft, width: lp.lineWidth, background: lp.lineColor }} />
                                {lp.showTick && <>
                                  <div className="bar-tick" style={{ left: lp.tickLeft, marginLeft: -1, background: lp.tickColor }} />
                                  <div className="bar-real-label" style={{ left: lp.labelLeft, color: lp.labelColor }}>{lp.label}</div>
                                </>}
                              </>);
                            })()}
                          </>
                        ) : <div style={{ fontSize: 10, color: "var(--muted2)", padding: "0 12px" }}>Sin fechas</div>}
                      </div>
                    </div>
                  );
                })
            }
            </div>{/* gantt-inner */}
            </div>{/* gantt-scroll */}
            <div style={{ padding: "10px 16px", display: "flex", gap: 14, borderTop: "1px solid var(--border)", background: "var(--surface2)", flexWrap: "wrap", alignItems: "center" }}>
              {[["var(--danger)", "Camino crítico"], ["#9EB3C8", "En tiempo / en curso"]].map(([color, label]) => (
                <div key={label} className="flex-gap"><div style={{ width: 10, height: 10, borderRadius: 2, background: color }} /><span style={{ fontSize: 9, color: "var(--muted)" }}>{label}</span></div>
              ))}
              <div className="flex-gap">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "repeating-linear-gradient(45deg,rgba(30,122,74,0.55) 0px,rgba(30,122,74,0.55) 3px,#9EB3C8 3px,#9EB3C8 8px)", border: "1px solid rgba(30,122,74,0.7)" }} />
                <span style={{ fontSize: 9, color: "var(--muted)" }}>Completada</span>
              </div>
              <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
                <div style={{ position: "relative", width: 22, height: 10 }}>
                  <div style={{ position: "absolute", left: 0, width: 14, height: 2, background: "#4A9C5D", borderRadius: 2, top: 4 }} />
                  <div style={{ position: "absolute", left: 11, width: 2, height: 8, background: "#4A9C5D", borderRadius: 1, top: 1 }} />
                </div>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>Cerrada en plazo o antes</span>
              </div>
              <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
                <div style={{ position: "relative", width: 30, height: 10 }}>
                  <div style={{ position: "absolute", left: 0, width: 26, height: 2, background: "#E24B4A", borderRadius: 2, top: 4 }} />
                  <div style={{ position: "absolute", left: 23, width: 2, height: 8, background: "#E24B4A", borderRadius: 1, top: 1 }} />
                </div>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>Cerrada con demora</span>
              </div>
              <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
                <div style={{ width: 22, height: 2, background: "#888780", borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: "var(--muted)" }}>Progreso en tiempo</span>
              </div>
              <div className="flex-gap" style={{ alignItems: "center", gap: 4 }}>
                <div style={{ width: 22, height: 2, background: "#E24B4A", borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: "var(--muted)" }}>Progreso atrasado</span>
              </div>
            </div>
          </div>
        </FullscreenWrapper>
      )}

      {/*  FULLSCREEN DETALLE  */}
      {fullscreen === "detalle" && (
        <FullscreenWrapper title={proyecto.nombre} onClose={() => setFullscreen(null)}>
          {/* Card resumen */}
          <div className="card mb12">
            <div className="flex-between">
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{proyecto.nombre}</div>
                <div className="flex-gap">
                  <span className={`badge ${STATUS_PROYECTO[proyecto.status]?.color || "b-gray"}`}>{STATUS_PROYECTO[proyecto.status]?.label}</span>
                  <span className={`badge ${proyecto.tipo === "externo" ? "b-purple" : "b-teal"}`}>{proyecto.tipo}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{proyecto.empresa}</span>
                  {proyecto.cliente && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {proyecto.cliente}</span>}
                  {proyecto.responsable && <span style={{ fontSize: 11, color: "var(--muted)" }}>·  {proyecto.responsable}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, color: "var(--blue)" }}>{pct}%</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>avance global</div>
              </div>
            </div>
            <div className="mt8"><PctBar pct={pct} /></div>
          </div>
          {/* Stats fila 1 */}
          <div className="stats mb12">
            <div className="stat"><div className="stat-label">Tareas</div><div className="stat-value" style={{ color: "var(--blue)" }}>{tareas.length}</div></div>
            <div className="stat"><div className="stat-label">Completadas</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{tareas.filter(t => t.porcentaje_avance >= 100).length}</div></div>
            <div className="stat"><div className="stat-label">Atrasadas</div><div className="stat-value" style={{ color: "var(--danger)" }}>{atrasadas.length}</div></div>
            <div className="stat"><div className="stat-label">Camino crítico</div><div className="stat-value" style={{ color: "var(--warn)" }}>{criticas.size}</div></div>
          </div>
          {/* Stats fila 2: subtareas */}
          {(() => {
            const todasSubs = tareas.flatMap(t => t.subtareas || []);
            // Calcular tareas por responsable
            const porResp = {};
            tareas.forEach(t => {
              const r = t.responsable || "Sin asignar";
              if (!porResp[r]) porResp[r] = { total: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
              const esAtrasada = t.fecha_fin && t.fecha_fin < today() && (t.porcentaje_avance||0) < 100;
              porResp[r].total++;
              if ((t.porcentaje_avance||0) >= 100) porResp[r].completadas++;
              else if (esAtrasada) porResp[r].atrasadas++;
              else if ((t.porcentaje_avance||0) > 0) porResp[r].en_curso++;
            });
            // Calcular SUBTAREAS por responsable propio de la subtarea
            const subsPorResp = {};
            tareas.forEach(t => {
              (t.subtareas || []).forEach(s => {
                const r = s.responsable || t.responsable || "Sin asignar";
                if (!subsPorResp[r]) subsPorResp[r] = { subTotal: 0, subEnCurso: 0, subCompletadas: 0, subAtrasadas: 0 };
                subsPorResp[r].subTotal++;
                const esAtrasadaSub = s.fecha_fin && s.fecha_fin < today() && (s.porcentaje_avance||0) < 100;
                if ((s.porcentaje_avance||0) >= 100) subsPorResp[r].subCompletadas++;
                else if (esAtrasadaSub) subsPorResp[r].subAtrasadas++;
                else if ((s.porcentaje_avance||0) > 0) subsPorResp[r].subEnCurso++;
              });
            });
            const todosResp = Array.from(new Set([...Object.keys(porResp), ...Object.keys(subsPorResp)]))
              .sort((a, b) => a === "Sin asignar" ? 1 : b === "Sin asignar" ? -1 : a.localeCompare(b));
            return (
              <>
                <div className="stats mb12">
                  <div className="stat"><div className="stat-label">Subtareas total</div><div className="stat-value" style={{ color: "var(--navy)" }}>{todasSubs.length}</div></div>
                  <div className="stat"><div className="stat-label">Pendientes</div><div className="stat-value" style={{ color: "var(--muted)" }}>{todasSubs.filter(s => (s.porcentaje_avance||0) === 0).length}</div></div>
                  <div className="stat"><div className="stat-label">En curso</div><div className="stat-value" style={{ color: "var(--blue)" }}>{todasSubs.filter(s => (s.porcentaje_avance||0) > 0 && (s.porcentaje_avance||0) < 100).length}</div></div>
                  <div className="stat"><div className="stat-label">Completadas</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{todasSubs.filter(s => (s.porcentaje_avance||0) >= 100).length}</div></div>
                </div>
                {/* Tabla responsables fullscreen */}
                <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                    <div className="stat-label">Tareas y subtareas por responsable de ejecución</div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "var(--surface2)" }}>
                        <th style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>Responsable</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }} colSpan={4}>— Tareas —</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted)", fontSize: 9, letterSpacing: .5, textTransform: "uppercase", borderBottom: "1px solid var(--border)", borderLeft: "2px solid var(--border)" }} colSpan={4}>— Subtareas —</th>
                      </tr>
                      <tr style={{ background: "var(--surface2)" }}>
                        <th style={{ padding: "4px 12px", borderBottom: "2px solid var(--border)" }}></th>
                        {["Total","En curso","Complet.","Atras.","Total","En curso","Complet.","Atras."].map((h, i) => (
                          <th key={i} style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: "var(--muted2)", fontSize: 9, textTransform: "uppercase", borderBottom: "2px solid var(--border)", borderLeft: i === 4 ? "2px solid var(--border)" : "none" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todosResp.map((resp, idx) => {
                        const s  = porResp[resp]     || { total: 0, en_curso: 0, completadas: 0, atrasadas: 0 };
                        const ss = subsPorResp[resp] || { subTotal: 0, subEnCurso: 0, subCompletadas: 0, subAtrasadas: 0 };
                        const bg = idx % 2 === 0 ? "#fff" : "var(--surface2)";
                        const cell = (val, color) => <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: val > 0 ? 700 : 400, color: val > 0 ? color : "var(--muted2)", background: bg }}>{val > 0 ? val : "—"}</td>;
                        return (
                          <tr key={resp} style={{ background: bg }}>
                            <ResponsablePopover resp={resp} tareas={tareas} today={today} />
                            {cell(s.total, "var(--navy)")}
                            {cell(s.en_curso, "var(--blue)")}
                            {cell(s.completadas, "var(--accent2)")}
                            <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: s.atrasadas > 0 ? 700 : 400, color: s.atrasadas > 0 ? "var(--danger)" : "var(--muted2)", background: bg }}>{s.atrasadas > 0 ? ` ${s.atrasadas}` : "—"}</td>
                            <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: ss.subTotal > 0 ? 700 : 400, color: "var(--navy)", background: bg, borderLeft: "2px solid var(--border)" }}>{ss.subTotal > 0 ? ss.subTotal : "—"}</td>
                            {cell(ss.subEnCurso, "var(--blue)")}
                            {cell(ss.subCompletadas, "var(--accent2)")}
                            <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: ss.subAtrasadas > 0 ? 700 : 400, color: ss.subAtrasadas > 0 ? "var(--danger)" : "var(--muted2)", background: bg }}>{ss.subAtrasadas > 0 ? ` ${ss.subAtrasadas}` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
          {/* Gantt */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--surface2)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>Gantt</div>
            <div className="gantt-wrap">
              <div className="gantt-scroll">
              <div className="gantt-inner">
              <div className="gantt-header" style={{ gridTemplateColumns: cols }}>
                <div className="gh-cell" style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>Tarea</div>
                {periodos.map((p, i) => <div key={i} className="gh-cell">{p.label}</div>)}
                {periodos.length === 0 && <div className="gh-cell">Línea de tiempo</div>}
              </div>
              {tareas.map(t => {
                const barStyle = getBarStyle(t);
                return (
                  <div
                    key={t.id}
                    className="gantt-row"
                    style={{ gridTemplateColumns: cols, cursor: "pointer" }}
                    onClick={() => setModalTarea({ ...t, _empresa: proyecto.empresa, _proyectoNombre: proyecto.nombre })}
                  >
                    <div className="gc-label">
                      <div className="gc-name">{t.nombre}{criticas.has(t.id) && <span className="cc-badge">CC</span>}</div>
                      <div className="gc-sub">{t.owner ? ` ${t.owner}` : t.responsable || "—"} · {t.duracion_dias}d · {t.porcentaje_avance || 0}%</div>
                    </div>
                    <div className="gc-bars" style={{ gridColumn: `2 / ${periodos.length + 2}` }}>
                      {barStyle ? (
                        <>
                          <div className={`bar ${getBarClass(t)}`} style={barStyle} />
                          {(() => {
                            const lp = getLineaProgreso(t, barStyle);
                            if (!lp) return null;
                            return (<>
                              <div className="bar-underline" style={{ left: lp.lineLeft, width: lp.lineWidth, background: lp.lineColor }} />
                              {lp.showTick && <>
                                <div className="bar-tick" style={{ left: lp.tickLeft, marginLeft: -1, background: lp.tickColor }} />
                                <div className="bar-real-label" style={{ left: lp.labelLeft, color: lp.labelColor }}>{lp.label}</div>
                              </>}
                            </>);
                          })()}
                        </>
                      ) : <div style={{ fontSize: 10, color: "var(--muted2)", padding: "0 12px" }}>Sin fechas</div>}
                    </div>
                  </div>
                );
              })}
              </div>{/* gantt-inner */}
              </div>{/* gantt-scroll */}
            </div>
          </div>
        </FullscreenWrapper>
      )}
    </div>
  );
}

//  LOGIN PAGE 
function LoginPage() {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (e) setError("Credenciales incorrectas. Verificá tu email y contraseña.");
    } catch {
      setError("Error de conexión. Verificá tu red e intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  const loginCSS = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    .login-page{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 560px;background:#FFFFFF;font-family:'IBM Plex Sans',sans-serif;color:#0F1419;text-align:left}
    .login-bg-overlay,.login-bg-lines{display:none}
    .login-split{display:contents}
    .login-left{display:flex;flex-direction:column;justify-content:space-between;gap:48px;padding:56px 64px;background:#002247;border:0;text-align:left}
    .login-left-integra-wrap{margin:0}
    .login-left-integra-img{height:52px;width:auto;object-fit:contain;opacity:1;display:block}
    .login-left-divider{width:100%;height:1px;background:rgba(255,255,255,.14);margin:24px 0}
    .login-left-company{display:flex;align-items:center;gap:14px;margin:0}
    .login-left-company-logo{width:40px;height:40px;border-radius:4px;object-fit:contain;border:0;background:rgba(255,255,255,.14);padding:4px}
    .login-left-company-name{font:600 24px/1.25 'IBM Plex Sans',sans-serif;color:#fff;letter-spacing:0}
    .login-left-line{width:56px;height:3px;background:#F8BC05;margin:24px 0}
    .login-left-sub{font:400 15px/1.55 'IBM Plex Sans',sans-serif;color:rgba(255,255,255,.82);max-width:420px;font-style:normal}
    .login-right{width:auto;display:flex;align-items:center;justify-content:center;padding:56px 64px;background:#FFFFFF}
    .login-card{width:100%;max-width:420px;background:transparent;border:0;border-radius:0;padding:0;backdrop-filter:none;text-align:left}
    .login-card-eyebrow{font:500 11px/1.2 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#4A5560;text-transform:uppercase;margin-bottom:12px}
    .login-card-title{font:600 24px/1.25 'IBM Plex Sans',sans-serif;color:#082F4E;margin-bottom:8px}
    .login-card-sub{font:400 15px/1.55 'IBM Plex Sans',sans-serif;color:#4A5560;letter-spacing:0;margin-bottom:28px;text-transform:none}
    .login-fg{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
    .login-fg label{font:500 11px/1.2 'IBM Plex Mono',monospace;color:#4A5560;letter-spacing:.08em;text-transform:uppercase}
    .login-fg input{border:1px solid #C9D0D6;border-radius:4px;height:40px;padding:0 12px;font:400 14px/1.2 'IBM Plex Sans',sans-serif;color:#0F1419;background:#FFFFFF;outline:none;transition:border-color 120ms cubic-bezier(.2,0,.38,.9)}
    .login-fg input::placeholder{color:#7A8792}
    .login-fg input:focus{border-width:2px;border-color:#002247;padding:0 11px}
    .login-btn{width:100%;height:44px;padding:0 16px;margin-top:24px;background:#F8BC05;color:#002247;border:none;border-radius:4px;font:600 15px/1.2 'IBM Plex Sans',sans-serif;cursor:pointer;transition:background-color 120ms cubic-bezier(.2,0,.38,.9);letter-spacing:0}
    .login-btn:hover{background:#DCA704}
    .login-btn:disabled{background:#E4E8EC;color:#7A8792;cursor:not-allowed}
    .login-error{background:#FFFFFF;color:#0F1419;border:1px solid #E4E8EC;border-left:3px solid #B3261E;border-radius:4px;padding:12px 16px;font:400 13px/1.45 'IBM Plex Sans',sans-serif;margin-bottom:16px}
    .login-footer{text-align:left;font:500 11px/1.2 'IBM Plex Mono',monospace;color:#4A5560;margin-top:32px;letter-spacing:.06em}
    .login-back{text-align:left;margin-top:12px;font:500 14px/1.2 'IBM Plex Sans',sans-serif;color:#002247;cursor:pointer}
    .login-back:hover{text-decoration:underline}
    @media(max-width:900px){
      .login-page{grid-template-columns:1fr}
      .login-left{padding:40px 24px;gap:32px}
      .login-left-integra-img{height:40px}
      .login-left-sub{max-width:100%}
      .login-right{padding:40px 24px}
    }
  
  `;

  return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page">
        <div className="login-bg-lines" />
        <div className="login-bg-overlay" />
        <div className="login-split">
          <div className="login-left">
            <div className="login-left-integra-wrap">
              <img src="/integra-logo-white-noclaim.svg" alt="INTEGRA" className="login-left-integra-img" />
            </div>
            <div className="login-left-divider" />
            <div className="login-left-company">
              <img src="/PL.png" alt="PL Offshore" className="login-left-company-logo" />
              <div className="login-left-company-name">PL Offshore | Projects</div>
            </div>
            <div className="login-left-line" />
            <div className="login-left-sub">We Find the Way, or We Make One.</div>
          </div>
          <div className="login-right">
            <div className="login-card">
              <div className="login-card-eyebrow">PL Offshore | Projects</div>
              <div className="login-card-title">Acceso al portal</div>
              <div className="login-card-sub">Solo personal autorizado</div>
              {error && <div className="login-error">{error}</div>}
              <div className="login-fg">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="usuario@paranalogistica.com.ar" autoFocus />
              </div>
              <div className="login-fg">
                <label>Contraseña</label>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
              </div>
              <button className="login-btn" onClick={handleLogin} disabled={loading || !email || !pass}>
                {loading ? "Ingresando..." : "Ingresar →"}
              </button>
              <div className="login-footer">PL Offshore · Acceso restringido</div>
              <div className="login-back" onClick={() => window.location.href = PORTAL_URL}>← Volver a Grupo PL</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

//  ROOT APP 
function ProjectsApp() {
  const [page, setPage]                         = useState("proyectos");
  const [proyectoSeleccionado, setProyecto]     = useState(null);
  const [notif, setNotif]                       = useState(null);

  const notify = useCallback((text, type = "info") => {
    setNotif({ text, type });
    setTimeout(() => setNotif(null), 4000);
  }, []);

  const [navOpen, setNavOpen] = useState(true);

  const Ico = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
  );
  const ICONS = {
    grid:  <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>,
    warn:  <><path d="M12 4.5l8.5 15H3.5z" /><path d="M12 10v4M12 17h.01" /></>,
    file:  <><path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6z" /><path d="M14 3v4.6h4.6" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9.5 4v16" /></>,
    bell:  <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    help:  <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.1 1-1.1 1.7v.3" /><path d="M12 17.5h.01" /></>,
    back:  <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>,
  };

  const SECCIONES = {
    proyectos: { titulo: "Todos los proyectos", sub: "Avance, camino crítico y desvíos de cada proyecto de la flota." },
    atrasados: { titulo: "Proyectos atrasados", sub: "Proyectos con tareas fuera de fecha. Ordenados por días de desvío." },
    detalle:   { titulo: proyectoSeleccionado?.nombre || "Proyecto", sub: "Tareas, camino crítico, hitos y reporte de desvíos." },
  };

  const NAV = [
    { titulo: "Vistas", items: [
      { id: "proyectos", icon: "grid", label: "Todos los proyectos" },
      { id: "atrasados", icon: "warn", label: "Atrasados" },
    ]},
  ];

  const seccion = SECCIONES[page] || { titulo: page, sub: "" };
  const inicial = (USUARIO || "G").replace(/@.*$/, "").slice(0, 2).toUpperCase();
  const navTo = (id) => { setPage(id); };

  return (
    <>
      <style>{CSS}</style>

      <header className="appbar">
        <img src="/integra-isotipo-white.svg" alt="INTEGRA" className="appbar-iso" />
        <span className="appbar-div" />
        <span className="appbar-instance">PL Offshore</span>
        <input className="appbar-search" type="search" disabled placeholder="Buscar en todo INTEGRA" aria-label="Buscar" />
        <div className="appbar-tools">
          <span style={{ color: "rgba(255,255,255,.86)", display: "block" }}><Ico d={ICONS.bell} /></span>
          <span style={{ color: "rgba(255,255,255,.86)", display: "block" }}><Ico d={ICONS.help} /></span>
          <span className="appbar-div" />
          <span className="appbar-avatar">{inicial}</span>
          <span className="appbar-user">{USUARIO}</span>
          <button className="appbar-link" onClick={() => window.location.href = PORTAL_URL}>Volver al portal</button>
        </div>
      </header>

      <div className={`shell ${navOpen ? "" : "is-collapsed"}`}>
        <nav className="sidebar">
          <div className="sidebar-header">
            <img src="/PL.png" alt="PL Offshore" className="sidebar-logo-img" onError={e => { e.currentTarget.style.display = "none"; }} />
            {navOpen && (
              <div>
                <div className="sidebar-logo-main">Projects</div>
                <div className="sidebar-logo-sub">PL Offshore</div>
              </div>
            )}
          </div>

          <div className="sidebar-nav">
            {NAV.map(grupo => (
              <div key={grupo.titulo} style={{ marginBottom: 8 }}>
                {navOpen && <div className="nav-section">{grupo.titulo}</div>}
                {grupo.items.map(it => (
                  <button key={it.id} className={`ni ${page === it.id ? "active" : ""}`} onClick={() => setPage(it.id)} title={it.label}>
                    <span className="ni-ico"><Ico d={ICONS[it.icon]} /></span>
                    {navOpen && <span className="ni-label">{it.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="sidebar-foot">
            <button className="sidebar-foot-btn" onClick={() => setNavOpen(v => !v)}>
              <span style={{ display: "block", color: "var(--muted2)" }}><Ico d={ICONS.panel} size={16} /></span>
              {navOpen && <span style={{ flex: 1, textAlign: "left" }}>Colapsar menú</span>}
            </button>
            {navOpen && (
              <div className="sidebar-foot-meta">
                <div>PROJECTS v1.2</div>
                <div>POWERED BY INTEGRA</div>
              </div>
            )}
          </div>
        </nav>

        <div className="main">
          <div className="pagehead">
            <div className="crumb">
              <button onClick={() => window.location.href = PORTAL_URL}>Portal</button>
              <span>/</span>
              <button onClick={() => setPage("proyectos")}>Projects</button>
              <span>/</span>
              <span className="crumb-current">{seccion.titulo}</span>
            </div>
            <div className="pagehead-row">
              <div>
                <h1>{seccion.titulo}</h1>
                {seccion.sub && <p>{seccion.sub}</p>}
              </div>
              {page === "detalle" && (
                <div className="pagehead-actions">
                  <button className="btn btn-ghost" onClick={() => setPage("proyectos")}>Volver a proyectos</button>
                </div>
              )}
            </div>
          </div>

          <div className="content">
            {(page === "proyectos" || page === "atrasados") && (
              <PageProyectos
                onSelectProyecto={p => { setProyecto(p); setPage("detalle"); }}
                notify={notify}
                filtroEmpresaExterno="Parana Logistica"
                soloAtrasados={page === "atrasados"}
              />
            )}
            {page === "detalle" && proyectoSeleccionado && (
              <PageDetalle
                proyectoId={proyectoSeleccionado.id}
                onBack={() => setPage("proyectos")}
                notify={notify}
              />
            )}
          </div>
        </div>
      </div>

      <nav className="mobile-nav">
        <div className={`mobile-nav-item ${page === "proyectos" ? "active" : ""}`} onClick={() => navTo("proyectos")}>
          <span className="mobile-nav-icon"><Ico d={ICONS.grid} size={18} /></span>
          <span className="mobile-nav-label">Proyectos</span>
        </div>
        <div className={`mobile-nav-item ${page === "atrasados" ? "active" : ""}`} onClick={() => navTo("atrasados")}>
          <span className="mobile-nav-icon"><Ico d={ICONS.warn} size={18} /></span>
          <span className="mobile-nav-label">Atrasados</span>
        </div>
        {page === "detalle" && (
          <div className="mobile-nav-item active">
            <span className="mobile-nav-icon"><Ico d={ICONS.file} size={18} /></span>
            <span className="mobile-nav-label">Detalle</span>
          </div>
        )}
        <div className="mobile-nav-item" onClick={() => window.location.href = PORTAL_URL}>
          <span className="mobile-nav-icon"><Ico d={ICONS.back} size={18} /></span>
          <span className="mobile-nav-label">Portal</span>
        </div>
      </nav>

      <Notif msg={notif} onClose={() => setNotif(null)} />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--navy, #213363)" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>Cargando...</div>
    </div>
  );

  if (!session) return <LoginPage />;

  return <ProjectsApp />;
}
