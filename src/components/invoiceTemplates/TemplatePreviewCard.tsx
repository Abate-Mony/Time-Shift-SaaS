import type { InvoiceTemplateBaseLayout, InvoiceTemplateFont, InvoiceTemplateLogoPosition } from '@/utils/types/invoiceTemplate'

interface TemplatePreviewCardProps {
    baseLayout: InvoiceTemplateBaseLayout
    accentColor: string
    font: InvoiceTemplateFont
    logoPosition: InvoiceTemplateLogoPosition
}

const logoAlign: Record<InvoiceTemplateLogoPosition, string> = {
    'top-left': 'items-start text-left',
    'top-center': 'items-center text-center',
    'top-right': 'items-end text-right',
}

// A live CSS approximation of what quotePdf.ts/invoicePdf.ts would actually
// render for this combination of knobs — not a stored/generated image.
// Deliberately mirrors the 3 structural renderers' real differences (accent
// header block vs a ruled table vs sparse single lines), not just a
// recolored clone, same "each layout needs a genuine personality" brief
// the backend renderers were built against.
export function TemplatePreviewCard({ baseLayout, accentColor, font, logoPosition }: TemplatePreviewCardProps) {
    const fontClass = font === 'Times-Roman' ? 'font-serif' : 'font-sans'

    return (
        <div className={`w-full aspect-[210/280] bg-white rounded-md border border-slate-200 overflow-hidden p-3 flex flex-col gap-2 ${fontClass}`}>
            {baseLayout === 'modern' && (
                <>
                    <div className={`flex flex-col gap-0.5 ${logoAlign[logoPosition]}`}>
                        <span className="text-[9px] font-bold tracking-wide" style={{ color: accentColor }}>INVOICE</span>
                        <div className="h-[2px] w-full rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-1.5 rounded-full bg-slate-100" style={{ width: `${90 - i * 12}%` }} />
                        ))}
                    </div>
                    <div className="mt-auto rounded px-1.5 py-1 self-end w-[60%]" style={{ backgroundColor: `${accentColor}1A` }}>
                        <div className="h-1.5 rounded-full w-1/2 ml-auto" style={{ backgroundColor: accentColor }} />
                    </div>
                </>
            )}

            {baseLayout === 'classic' && (
                <>
                    <div className={`flex flex-col gap-1 ${logoAlign[logoPosition]}`}>
                        <span className="text-[9px] font-bold text-slate-800 tracking-wide">INVOICE</span>
                        <div className="h-px w-full" style={{ backgroundColor: accentColor }} />
                    </div>
                    <div className="flex flex-col gap-1.5 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <div className="h-1 rounded-full bg-slate-200" style={{ width: `${60 - i * 8}%` }} />
                                <div className="h-1 w-6 rounded-full bg-slate-300" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto self-end w-[55%] border-t-2 border-slate-800 pt-1">
                        <div className="h-1.5 rounded-full w-2/3 ml-auto bg-slate-800" />
                    </div>
                </>
            )}

            {baseLayout === 'minimal' && (
                <>
                    <div className={`flex flex-col gap-1 ${logoAlign[logoPosition]}`}>
                        <span className="text-[9px] font-medium text-slate-500">Invoice</span>
                    </div>
                    <div className="flex flex-col gap-2.5 mt-2">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="h-1 rounded-full bg-slate-100" style={{ width: `${50 - i * 6}%` }} />
                                <div className="h-1 w-6 rounded-full bg-slate-200" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto self-end text-right">
                        <div className="h-2 w-10 rounded-full ml-auto" style={{ backgroundColor: accentColor, opacity: 0.85 }} />
                    </div>
                </>
            )}
        </div>
    )
}
