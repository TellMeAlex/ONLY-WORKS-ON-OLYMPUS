export type SectionId =
  | "meta_agents"
  | "providers"
  | "settings"
  | "agents"
  | "categories"
  | "skills"
  | "preview";
export type ConnectionStatus = "connected" | "standalone" | "checking";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

let _activeSection = $state<SectionId>("meta_agents");
let _selectedMetaAgent = $state<string | null>(null);
let _selectedRuleIndex = $state<number | null>(null);
let _connectionStatus = $state<ConnectionStatus>("checking");
let _toasts = $state<Toast[]>([]);
let _modalState = $state<ModalState>({
  open: false,
  title: "",
  message: "",
  onConfirm: () => {},
});

export function activeSection(): SectionId {
  return _activeSection;
}
export function selectedMetaAgent(): string | null {
  return _selectedMetaAgent;
}
export function selectedRuleIndex(): number | null {
  return _selectedRuleIndex;
}
export function connectionStatus(): ConnectionStatus {
  return _connectionStatus;
}
export function toasts(): Toast[] {
  return _toasts;
}
export function modalState(): ModalState {
  return _modalState;
}

export function setActiveSection(s: SectionId): void {
  _activeSection = s;
}
export function setSelectedMetaAgent(name: string | null): void {
  _selectedMetaAgent = name;
}
export function setSelectedRuleIndex(i: number | null): void {
  _selectedRuleIndex = i;
}
export function setConnectionStatus(s: ConnectionStatus): void {
  _connectionStatus = s;
}

export function showToast(message: string, type: Toast["type"] = "info"): void {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, message, type }];
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
  }, 3000);
}

export function dismissToast(id: string): void {
  _toasts = _toasts.filter((t) => t.id !== id);
}

export function openModal(
  title: string,
  message: string,
  onConfirm: () => void,
): void {
  _modalState = { open: true, title, message, onConfirm };
}

export function closeModal(): void {
  _modalState = { ..._modalState, open: false };
}
