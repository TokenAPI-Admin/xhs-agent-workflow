package xiaohongshu

import (
	"context"
	"strings"
	"time"

	"github.com/go-rod/rod"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

type LoginAction struct {
	page *rod.Page
}

func NewLogin(page *rod.Page) *LoginAction {
	return &LoginAction{page: page}
}

func (a *LoginAction) CheckLoginStatus(ctx context.Context) (bool, error) {
	pp := a.page.Context(ctx)
	pp.MustNavigate("https://www.xiaohongshu.com/explore").MustWaitLoad()

	time.Sleep(1 * time.Second)

	ok, reason := a.hasLoggedInSignal(pp)
	if ok {
		logrus.Infof("xhs login status: logged in via %s", reason)
		return true, nil
	}

	logrus.Infof("xhs login status: not logged in; cookies=%s", a.cookieSummary())
	return false, nil
}

func (a *LoginAction) Login(ctx context.Context) error {
	pp := a.page.Context(ctx)

	// 导航到小红书首页，这会触发二维码弹窗
	pp.MustNavigate("https://www.xiaohongshu.com/explore").MustWaitLoad()

	// 等待一小段时间让页面完全加载
	time.Sleep(2 * time.Second)

	if ok, reason := a.hasLoggedInSignal(pp); ok {
		// 已经登录，直接返回
		logrus.Infof("xhs login page already logged in via %s", reason)
		return nil
	}

	// 等待扫码成功提示或者登录完成
	// 这里我们等待登录成功的元素出现，这样更简单可靠
	pp.MustElement(".main-container .user .link-wrapper .channel")

	return nil
}

func (a *LoginAction) FetchQrcodeImage(ctx context.Context) (string, bool, error) {
	pp := a.page.Context(ctx)

	// 导航到小红书首页，这会触发二维码弹窗
	pp.MustNavigate("https://www.xiaohongshu.com/explore").MustWaitLoad()

	// 等待一小段时间让页面完全加载
	time.Sleep(2 * time.Second)

	if ok, reason := a.hasLoggedInSignal(pp); ok {
		logrus.Infof("xhs qrcode fetch sees existing login via %s", reason)
		return "", true, nil
	}

	// 获取二维码图片
	src, err := a.findQrcodeSrc(pp)
	if err != nil {
		return "", false, errors.Wrap(err, "get qrcode src failed")
	}
	if src == nil || len(*src) == 0 {
		return "", false, errors.New("qrcode src is empty")
	}

	return *src, false, nil
}

func (a *LoginAction) WaitForLogin(ctx context.Context) bool {
	pp := a.page.Context(ctx)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	start := time.Now()
	lastLog := time.Now().Add(-10 * time.Second)

	for {
		select {
		case <-ctx.Done():
			logrus.Warnf("xhs login wait timed out after %s; cookies=%s", time.Since(start).Round(time.Second), a.cookieSummary())
			return false
		case <-ticker.C:
			ok, reason := a.hasLoggedInSignal(pp)
			if ok {
				logrus.Infof("xhs login confirmed after %s via %s; cookies=%s", time.Since(start).Round(time.Second), reason, a.cookieSummary())
				return true
			}
			if time.Since(lastLog) >= 5*time.Second {
				lastLog = time.Now()
				logrus.Infof("xhs login still waiting after %s; cookies=%s", time.Since(start).Round(time.Second), a.cookieSummary())
			}
		}
	}
}

func (a *LoginAction) hasLoggedInSignal(pp *rod.Page) (bool, string) {
	if a.isLoginPage(pp) {
		return false, ""
	}

	for _, selector := range []string{
		".main-container .user .link-wrapper .channel",
		".side-bar-component .user",
		".user.side-bar-component",
		".creator-entry",
		"a[href*='/user/profile']",
	} {
		exists, _, err := pp.Has(selector)
		if err == nil && exists {
			return true, "selector " + selector
		}
	}

	if ok, reason := a.hasLoggedInCookie(); ok {
		return true, reason + " with non-login page"
	}

	return false, ""
}

func (a *LoginAction) isLoginPage(pp *rod.Page) bool {
	result := ""
	err := rod.Try(func() {
		result = pp.Timeout(3 * time.Second).MustEval(`() => {
			const href = location.href || "";
			const text = (document.body && document.body.innerText) || "";
			if (href.includes("/login")) return "url";
			if (text.includes("登录后推荐更懂你的笔记")) return "home-login";
			if (text.includes("登录后查看搜索结果")) return "search-login";
			if (text.includes("手机号登录") && text.includes("获取验证码") && text.includes("扫码")) return "login-form";
			return "";
		}`).String()
	})
	if err != nil {
		logrus.Warnf("xhs login page check failed: %v", err)
		return false
	}
	if result != "" {
		logrus.Infof("xhs login page detected via %s", result)
		return true
	}
	return false
}

func (a *LoginAction) hasLoggedInCookie() (bool, string) {
	cks, err := a.page.Browser().GetCookies()
	if err != nil {
		logrus.Warnf("xhs login cookie check failed: %v", err)
		return false, ""
	}

	for _, ck := range cks {
		name := strings.ToLower(ck.Name)
		if ck.Value == "" {
			continue
		}
		if name == "web_session" || strings.Contains(name, "web_session") {
			return true, "cookie " + ck.Name
		}
	}

	return false, ""
}

func (a *LoginAction) cookieSummary() string {
	cks, err := a.page.Browser().GetCookies()
	if err != nil {
		return "error:" + err.Error()
	}
	if len(cks) == 0 {
		return "none"
	}

	names := make([]string, 0, len(cks))
	for _, ck := range cks {
		if ck.Name != "" {
			names = append(names, ck.Name+"@"+ck.Domain)
		}
	}
	if len(names) > 12 {
		names = append(names[:12], "...")
	}
	return strings.Join(names, ",")
}

func (a *LoginAction) findQrcodeSrc(pp *rod.Page) (*string, error) {
	for _, selector := range []string{
		".login-container .qrcode-img",
		"img.qrcode-img",
		".qrcode img",
		"img[src^='data:image']",
		"img[src*='base64']",
	} {
		el, err := pp.Element(selector)
		if err != nil || el == nil {
			continue
		}
		src, err := el.Attribute("src")
		if err == nil && src != nil && *src != "" {
			logrus.Infof("xhs qrcode found via selector %s", selector)
			return src, nil
		}
	}

	return nil, errors.New("qrcode image element not found")
}
