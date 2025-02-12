import {DOCUMENT} from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    forwardRef,
    HostBinding,
    Inject,
    Input,
    Optional,
    Self,
    ViewChild,
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {
    AbstractTuiControl,
    TUI_FOCUSABLE_ITEM_ACCESSOR,
    tuiDefaultProp,
    TuiFocusableElementAccessor,
    TuiNativeFocusableElement,
    tuiPure,
} from '@taiga-ui/cdk';
import {
    TUI_TEXTFIELD_SIZE,
    TuiDirection,
    TuiHintMode,
    TuiPrimitiveTextfieldComponent,
    TuiTextfieldSizeDirective,
    TuiTextMaskOptions,
    TuiWithTextMask,
} from '@taiga-ui/core';
import {EMPTY_MASK} from '@taiga-ui/kit/constants';
import {TUI_COPY_TEXTS} from '@taiga-ui/kit/tokens';
import {PolymorpheusContent} from '@tinkoff/ng-polymorpheus';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {mapTo, startWith, switchMap} from 'rxjs/operators';

// @dynamic
@Component({
    selector: 'tui-input-copy',
    templateUrl: './input-copy.template.html',
    styleUrls: ['./input-copy.style.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: TUI_FOCUSABLE_ITEM_ACCESSOR,
            useExisting: forwardRef(() => TuiInputCopyComponent),
        },
    ],
})
export class TuiInputCopyComponent
    extends AbstractTuiControl<string>
    implements TuiWithTextMask, TuiFocusableElementAccessor {
    @Input()
    @tuiDefaultProp()
    textMaskOptions: TuiTextMaskOptions | null = null;

    @Input()
    @tuiDefaultProp()
    successMessage: PolymorpheusContent = this.copyTexts[1];

    @Input()
    @tuiDefaultProp()
    messageDirection: TuiDirection = 'bottom-left';

    @Input()
    @tuiDefaultProp()
    messageMode: TuiHintMode | null = null;

    private readonly copy$ = new Subject<void>();

    @ViewChild(TuiPrimitiveTextfieldComponent)
    private readonly textfield?: TuiPrimitiveTextfieldComponent;

    constructor(
        @Optional()
        @Self()
        @Inject(NgControl)
        control: NgControl | null,
        @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private readonly documentRef: Document,
        @Inject(TUI_TEXTFIELD_SIZE)
        private readonly textfieldSize: TuiTextfieldSizeDirective,
        @Inject(TUI_COPY_TEXTS) private readonly copyTexts: [string, string],
    ) {
        super(control, changeDetectorRef);
    }

    @HostBinding('class._has-value')
    get hasValue(): boolean {
        return !!this.value;
    }

    @tuiPure
    get hintText$(): Observable<PolymorpheusContent> {
        return this.copy$.pipe(
            switchMap(() =>
                merge(
                    of(this.successMessage),
                    timer(3000).pipe(mapTo(this.copyTexts[0])),
                ),
            ),
            startWith(this.copyTexts[0]),
        );
    }

    get nativeFocusableElement(): TuiNativeFocusableElement | null {
        return this.computedDisabled || !this.textfield
            ? null
            : this.textfield.nativeFocusableElement;
    }

    get focused(): boolean {
        return !!this.textfield && this.textfield.focused;
    }

    get icon(): string {
        return this.textfieldSize.size === 's' ? 'tuiIconCopy' : 'tuiIconCopyLarge';
    }

    get computedMask(): TuiTextMaskOptions {
        return this.textMaskOptions || EMPTY_MASK;
    }

    onValueChange(textValue: string) {
        this.updateValue(textValue);
    }

    onFocused(focused: boolean) {
        this.updateFocused(focused);
    }

    onHovered(hovered: boolean) {
        this.updateHovered(hovered);
    }

    onPressed(pressed: boolean) {
        this.updatePressed(pressed);
    }

    copy() {
        if (!this.textfield || !this.textfield.nativeFocusableElement) {
            return;
        }

        this.textfield.nativeFocusableElement.select();
        this.documentRef.execCommand('copy');
        this.copy$.next();
    }

    protected getFallbackValue(): string {
        return '';
    }
}
