interface Tab {
  id: string;
  label: string;
  contentId: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className="mb-4 inline-flex h-auto flex-wrap items-center justify-center rounded-lg bg-[#F4F6FD] p-1 text-muted-foreground"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activeTab === tab.id ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
          }`}
          aria-disabled="false"
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={tab.contentId}
          id={`trigger-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
