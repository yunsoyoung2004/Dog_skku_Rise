const logoImg = "https://www.figma.com/api/mcp/asset/3536782b-2696-4419-ba6a-95a020af5338";

export default function DesignerHeaderBrand() {
  return (
    <div className="designer-header-brand">
      <img src={logoImg} alt="멍빗어" className="designer-header-logo" />
      <span className="designer-header-title">멍빗어</span>
    </div>
  );
}
