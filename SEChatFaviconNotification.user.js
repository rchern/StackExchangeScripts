// ==UserScript==
// @name           Stack Overflow Chat Favicon Notifier
// @namespace      yijiang
// @description    Watches the SO Chat for new messages, and changes the Favicon accordingly
// @include        http://chat.stackoverflow.com/rooms/*
// @include        http://chat.meta.stackexchange.com/rooms/*
// @include        http://chat.stackexchange.com/rooms/*
// @include        http://chat.askubuntu.com/rooms/*
// @exclude        http://chat.stackoverflow.com/rooms/info/*
// @exclude        http://chat.meta.stackexchange.com/rooms/info/*
// @exclude        http://chat.stackexchange.com/rooms/info*
// @exclude        http://chat.askubuntu.com/rooms/info/*
// ==/UserScript==

(function(){
	function getLink () {
		return document.querySelectorAll('head link[rel*=shortcut]')[0];
	}
	
	var title = document.title,
		iconURL = getLink().href,
		img = new Image(),
		canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		host = window.location.hostname,
		sites = {
			gaming: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAXklEQVQ4jWNgoBa4z8HxHx0TI0e5AdgkScFEG/D7yZP/v588GUADkA2iyACKXYBhwFUGBrb9DAwcJGp8R1Q6wInZ2b+TlCKR8FOykjQM3+PgeE3QAGyGkaSJqgYQAwBdcz9MXASc9AAAAABJRU5ErkJggg==',
			cooking: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACD0lEQVQ4jc2SwWsaQRTG50/In7DgLBXcoYalF09DL5ZiJBQPEXIoQQI9Vei1Bw9SlAqCiLK7B10oIaWpbTEgZAl7SEBLFHvRaoOYQrJCECXrQUIOXw/BJVuTS0/94F1m3m/ee/M+Qv5LqT7Br0g0sYiiRHlRolxhNKtKYltjIiqRMFRJbC/DTCztBjnq6STODg20Cjnsb21if2sT9XQS414XC1UiYbhghXnWd4Mc1/YV5iML9mnfSZ6PLPTzGcxHlnOmMRGk6BUEhdGsJlFTY3T6c0dHM76NTioB+7QPq1ZFM76NRizqevDX189QJfqFqEwc1tNJWCffMe510UklYHAZjVgUjVgU/XwGl0emA1q1KgBAD8hQfYKfaEx0Lu9WuKtBWQEA3MxsdFIJjHvd2/YJIUSTqHnw+hVmF+f4/WnHVW0BmSEOAOjnM7BqVewGOVSf5yUhhJCsIKyoTCxpjE5P3r+DGeKuTgZlBccba5i0mzC4jEFZwd7zpyhKlC/tXmN0evDiGcwQx+WRCatWxfHGGgwu48fbN878rUIOikQTSx5QmGf9W+AxDC6jk0pgUFYwaTdxM7NdY50dGrcb+FtZQVj5+MQHg8uYtJv3fui1fYVKJAyF0ey9Nv6w6h0aXEY/n3GBs4tztAo56AH5YZgQQjQfjev+R2191etYWA/IUJk4VJlYKnoF4UH4X/QHlvTYdeSZTVAAAAAASUVORK5CYII=', 
			webapps: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADIElEQVQ4jc1Tf0jTCRx9tX5B0CEUdVdcctcPgovyrAjKSqikFZOkEWdDrAxu+KMyM/JuZYZrXWszdf5Ylj+WmQ2bVlp2l9qmo5xzS115itXcmtbKH5tu+y63T/9MIYj+7sH768N7vA+8B3xXUOtM+24/aNZkKe51i4vvvrxxr6khq6h8C4BZAKZ9W6zvisirqOvMyFe+sQ+NfBq0D3lTLpW9EhYo27nR0Rui+fyg23XqBVwul/VVs9KaRo3W2O1gGK/fwzBUpnpIo84xf1x6Xm+q+LrxqOha+0FBTkd2WU1VWFjEjwBmTIn/1batzpQrn/fb7IzX6yWNzkjJwlzS6Iw07nL7Tb1mV89rq9syYGcEORXmv0WyLAALALBQ36L7raS6oT5RWNQ7Nu7yCfMVlCzMneJ5WSkxDEMMw5DL5aLHWoNzb8L5ToFEruTy+CtxuaTmyX21fsgxNu5r0XdQikhGow4nnRDm0qjDSSkXZNT0rJ0+Dg+T7d176jNb6MGTZ54UUYH9lChPg5i07B6Ph/Ezgb/zy1Xk9njoqaGLhkZGKLtUSTJFFfWZLWTq6SN95wvS6NpJVd/k2xj15xtwEkXdkxHVrUY6nplD7+wfyDowSK8tVopPl1Bl7X+ke95F6lY9PVJrqfpRIylUtf41ETFvwYkXGlo7/ncNvreT2WqjkyIZJaRL6S+JnPhnxJSYIaUGbSvVNTbTnYePqby6jooqVXT8nNgdFhXXj4sFFYXhvNRuabFyuFln8LW0GUh+q5oycor9FwvLfIo7tRPyiqoJ6bWbn85kFXrjBSJ3ZFyycz2bNxAVHavCitDQ+Qfjk/lJAnFbKCeuP116dexYhsQRwo61rt8daw3ZxXv7+64DtnVsnm3L3kMWTkzCq0OJqW2bt+64AmA/ALAABC0ODl6blJZZeSDhtOnIibOmPfv+KA3fyZZsZ3P+2RS+I3Ptug1pwb8uT/ppydLDYLEiAWwGsGyyS9MBzAawCEAogO0AtgEIAbAKwEoAKwD8AuBnAAsBzAts5AuwAMwFEATgBwBzAMwM1HZG4D49sIVpAPAZrcDAsT9JO/sAAAAASUVORK5CYII=',
			programmers: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABcUlEQVQ4ja3PsYoaYRSG4VPogJ2d6AXI3oBgOc0MgzCChUiCyEyzLLvl3sCylZ07zcKAoGA6y8Q6hB8kF2FhiEbCVDY6M+L/ptphA6sSNh+c7pyH74j8z6xvboiCgHchvx8eiB4f+X53x5erK9T19WUwen4+ufTZsvhkmueR6OmJH67Lzw8f+XV/T3R7yzfHyY6++v773vqnWJaF7/t4nkev16PT6dBut6nX61Sr1fNNWq0Wg8GA19lutywWC5RSNJtNGo3G24ht2/T7fcIw5Hg8kqYpaZpyOBwyYDQaYdv2aUBEZDgcorUmSZJsXoAgCE4DpmnieR5hGKK1Jo7jDEjTFKUU4/H4NCAiUqvVmE6nAH81SJIEpRSTyeQ8ICLiui77/T47jOM4azCbzS4DjuOw2+0A0FqjtQZAKYVS6jLQ7XaZz+csl0vW6zWr1YrNZnO+gWEYGIZBPp+nUCiQy+UoFouUy2VKpRKVSuXNERH5A+OVSIxr3NrHAAAAAElFTkSuQmCC',
			math: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACI0lEQVQ4jX2Tv2/UMBzFvy2VECe18lXt2UnsOCRm759wf8ItqLmNibkSK5RMHbrcxEAz3IBYqSokhJAgMIF0l1BUCRZKEJWgonXzJzyWJPT3kzz5fT+y37OJrtCxigZWRaVVUXnsRoOrfJfqreuPD6WBrdehF+Gb8MfXDpUsYFaa5K8XrKSOyp45CnsiwHf3NnLuY8p1diRN/8gzo5IF7MzwkTSJlVF1ou7ASoMdV1epq5A6CoXQ+LAs8csL0eyfKFP9kWHSAh4Q4VNPwSqD3zLCO66Quj5SVyHnPtLOAjZn5/DVCWClwU8vRC58tIAhEWIiPLnZQc595NzHq2VvtOWoMud+uUEz2ZAIQyK86PaQC41C6LOAIRHWiVrAZEn2R4yxjDEWEyWNJ+0stJ4WUBuqBjDtqXHGGDu1H8RE480bc/gsNHa5rnLur7WAfTdMfnghXi4KHHghTqTZPg0YELFjFY2bWi+EeJ8I75c9WGlw4EXYExoTIftNXTFR/zERdoWGVQalG+LL+QxiImzMzKIQGjn3se+FIyujynpR+XrRGcW1Z6fLL2bQANaJUNQJH3ghrDKwyuBQRtjpcgyJsHVr/iJglWhtSFQ9qkN8Pt+t1oiwzXrtS3yz6FRx3ULBdTUR/v8MmqAeEiUfmQhioqw5VV5facpVdpdo5WlnITkd8KVaJRrHde+F0MiFxrSnrv9M5xUT3YuJyoLrcrIk+1f5/gHh6Co+e0undAAAAABJRU5ErkJggg==',
			webmasters: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADF0lEQVQ4jYWTXUiTcRTG/3URqJGQFUIaZgVRN4FWVF5UBNWFCrpQS6yMog+XkDXLPiFaNa1ZSbmKKDCycGQL3aau5XRzvdv71+Wm5sfr2mzONzffVyuNiqeLLFOkfvDAgfOcm3OeQ8g4Fy5g5q8KMwghhIrIsgWxwRbEBioi6+/ehHccixchDI9IVkCc3YdQKiCeFSCLvlm9JLKobjUrQEYFxNt9CGUFxDE8Ii1ehBBCCPGnpuZ2PSw/x4rIpAIkTYM/jhZSX/WpBm54hcqEVQ8aceJ1zw+Zqbv7hXvkLBUgMQ9+37Nf474ZedEqIf6MDHAlKrhMNom0umvO5sdvnMnP7EhVU1xmPCi096HI0Y+Tpm4kPDSPrVQZE3K1njP7XvQi5ooNpD8trc0tv0pbBkYzI4p0xQuVOsQodTjdyEHB9qHq4xhqhr7hZAOH+YoqRCi0fGlL8GByWYd7kfzNK0IIIUYes2v7v5zY9oT5vv5BA06ZepBv5iBr9qK0/xOe8qOo9IxgzX0T4h+ZkaJ2KI08Zk9aZIamVXrW+h6KZh8ytS4o34uTdJ1+wCFdG7Jr2hF9w6AnU9n90nnxHOPFfmMnlt02QNbiw6WuwIQYD+Lu1SPf3ItNj5n2ScNMANGP3gXuJj93IOnlW4TLNVhQWI0UrQunnTzOOHmU933GTkMHdmpdKGjkWpkAov9kgIpIr/WNbY0o1At7Tb1YfseIcLkG4XINtqibkcf6cK9HxLoyK9aUMThS13mFiki3eBFC9H6EURFSu4i1MSWG/CxdB7LrOcxTVCG2xABJTSdyLB5caxtEdu07RCnrnEZ+NIGKkOr9CCPjsd1Oh5HECjggNXTqE9UObFW/xcYKB7Zp2nHc4kHuaw67NK3+SvdwAR1GEhWxfSLKIuZaA4hiRSy1+xCarXMeKWjkOuYV6b/Ov1aDY8Yef1IFW3xQ71jAilhqDSDKImLulDv8epTfUBFZTUNDG0sHS4vVwfpb//JOi01AbGWw6a4qoML5j4eR409c/N+hqeT4ExfnDaS68gZSDDtcK2dN5/kJwrUeiRdJOWQAAAAASUVORK5CYII=',
			askubuntu: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABXElEQVQ4jZ2Tv4rCQBDG5w1sfAg761Q2NmG3FyuxFAKWeQCLq2yFVNfYp0l3xRWBtLKlmEUliErgslxCOCTwXaFZ/8RDz4WBTXbmN7PfzhDdrIVJrZDRu+SUSE44WRJychcmtW799ZJtqoWc3IuguxYy+pRtqlWCJaPZo2BtjGZXkGcy36tE3/mZgCzwsLHNW0iPToI9BOTCrwI4uSQZLSUnRJaBIlUoUoX9eICNbeKwWwEAtqOuBih3gv14oCFUbpadOpadOmLHxmG3wtf0Dbnw9VkufPyEQv+rAGLHRpEq5MIHAESWgVz4KFKlKwCA2LErgKQUSbkTrPsNAMC638C630AWePj+mCIXvk5yqYUWscyYCx9Z4CF2bP0dWQaUO0FkGdiOusgC7yzis8/4Ry/0jo3E6PMVwJxT87VWPtvwepj+WYlu58o4H2cjuXLm5IaMenNOTclpWPr8AvZxHtvnNf8+AAAAAElFTkSuQmCC',
			photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACRElEQVQ4jaXDW0tTAQDA8fM9woqEqMAo6EGEHgrrIcUbuZvNTJfOSzl1KmJeZom6s6l5zaUV4iW3SZm99GBSJEihSEQWZMtkOtfOPHA8NMbYv+/QfvATSJAQj8cJ1VhQdVrU/HwO9XpUnZ4Do5avdzKZEVMZHj6L8+l5WlavUSXfpOKwmJZQPfF4HCEWi/G7tJqtnEI2Mwv5mWEgmJHHD8Ml5ptPMdR7lDFHEiNPkrGtpVF+mMOtmIZapZxYLIYQjUZ5Vj3MkN5Of34PI3mdzGjqma3Ipb/7DAN9x5gePMKiO4nnG6fpCl+k4m82VrmcaDSKEIlEsNdOcd84Sqd+gC7dQzpviLRV1tHSno3TcYH5iRMsLx1n+XsyM/sptCqXaZTLiEQiCKqqMmiZQCzoo1cr0qdxIBZ001bWiqXJQr29mEH3VRbWzrH06yRzeyl0yOk0HZhRVRVBURT6rZPYjQM4tA56NSKi3kGL2U6RrYcslxPj63Ycnwx4N9KZ+aDB+bYWcfUBiqIgyLLMvdF1LLb3WGsWaKh0Y61ZwGxbItf1jlTvImkvvJROTzA6OIS7fZy5BjcvOxaRZRlBkiTKvSG0kwfoxvcxjO2iG9/n+mSYrFmJKx4fOY++0Fz3mamSj7wxrbBStM561TckSUIIBoM0vtrD5AlT7Alz2xvC5JEweSRKvBKm+T80DQd5fDfAcrGfTbMfnznAVsMuwWAQIRAIIMvyfw0EAgh+v59ECjs7OyRS2N7eJpGCz+cjkYLL5SKR/wBu9SXq7QC25AAAAABJRU5ErkJggg==',
			superuser: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABM0lEQVQ4jZ3TMUsDQRCG4deAkECI4K+wsVBRFKxsLGy1E+wsLARBSyFdsJE0NrFQMEW8na1stBAb/QE2GguVVOLd7qZUMN5aXBSREHM3MNWwD98yu5BUFfBADHjyxRoA9dY12r2jzCWBWaBPfQOnwBqF0iwAtftFlN1FXIh2H4hZ/Q/Y6TkNXucQ10GZkLotpQcAlH1Cu5jAzGQEoiZiYwI3nwbwgGdqfZggaqKdzwLErGyNEkR33QRLWa6Q4/hxH+084m5pmGnK5VwaAI6u8ihzgHYeZTtpE0AjmkTsC9rFiL1JD4g9R2yMMnt/4w8KJFuQcKLXeDAg2cJ4NkDbh+476AucAZvkR5Kfd9hcRpkNVLSN2DeU/UTMWC+gArR/ulCsAnDSukC7drefEVcBhn4f/AKBs7SVr7eXywAAAABJRU5ErkJggg==',
			serverfault: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAkUlEQVQ4jWNgoBRcvHTlPzGYgYGB4aWG7v83str/38hq/3+tbvj/tYrif6IMuHb1LtwAZPxWUYw4A5Bd8ExHH8UQioOAYcXKtf+JwQwMDAwzFJX/o+OBNWC+rDQVwiAqKuY/MZiBgYFBX1z8PzoeBAZQA/yHYQ5Obqw0FDNwcHL/R8cM6JrxYPwGYHMJGhurAQAacYAPCrFaGAAAAABJRU5ErkJggg==',
			english: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAB4UlEQVR4nO3aMZHjMBQGYEMIhIWgJpYsN4FgCIEQCGHwlkEgBEIgBEIgBMJeYTuTzLm9U7HfN6NGav7qzdOTug4AgH8s+mGKXC9R6jlS2rXOA7Ap+mH6LuPPuiLXy8d5qcd5f3xGqcdGMQG6Lko9R66PSGkXuV7+Klj9MM3Fqhwij7dWOQG6yMNpLVKR0u61+mGKUs9RymEuVvWqYAFNrVe+7zL+rDOsyPX+fk18nffD1Dov8Est17xnlPIVeTjFvqal47pHKYdlGH+fB/Llq3Ve4BfbuuYtBev66rjmonVtlRGg67quizzeItf7x15Ku8jjbSlYx2XobnYFtPXeSW2e72uKPD4jj/GfowF8ilIOb/+vHpHHmF8G6/nVZS0zrtZZAdZf7o/NV8FcH7GvqXVGgA/zi+Fwmrur+cWwdSYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC2/QE1fKVGw+uhXAAAAABJRU5ErkJggg==',
			apple: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAADe0lEQVR4nO3WO2iddRgG8D8WHboUHEIXUXTJoCgYvIAVioKgdRAURCiaUkXbqRWkCIEODtqhdqnWSy/BFISAaRI0TSVUKJg0qdY0pxeaNrc25/vynVxMck4yvg6ihVLURc6Q3w9e/nzP9EwPX0q33NXX1/dET0/Pc/903d3dzzQ3N9+XUro7AdTBupTSAzMzMyfm5+fP/NsVRfH9li1bHk0p3VPv4sDa05BlWdfKykr81yuXyz+klO6vd3Fg7XmkUqmcrdVqUavV4mbxe5TGi/jr+07Z/Pz8ZErp4XoXB9aex4uiGFpeXo6R8ZnY03YuPum4EF+cuhzVavWO2dzc3FRK6bF6FwfWnqaiKIaq1Wr0/joZ354ZjcXqauw+2h8rKytx8peJ6Dw7Fvn8cuw+2h+1Ws1gAXXTlGXZ0NLSUgxfz2PH5z/Fgc7zf78tbf3R0jYQLW0DcaDzvD8soK6asiwbWlxcjGq1GjeLhRi+nsdb+0/G8PU8jvReiCO9F+K3a3msrq7G0tJSVCoVgwXURdPFixe7siyLoiji6sR0DF6ajNc++i6GrtyIg52DcbBzMPpL4zE7Oxt5nsfExMSVZLCAOmgqlUpd5XI5Tg9djpc+PB57vjz15/vVqdi270Rs23cimvd1xAeHTkaWZTE+Pm6wgLpoGhkZ6SqXy/F1d398fPx0zMwuxOZdh6NWq0Vrz7k42NEf127ksXnX4cjzPMbGxgwWUBdPDwwMHJqeno6+wUvx1I7P4pWWb2LHpx2xsLAQp89duZXt74g8z6NUKvWmlJ6sd3Fg7Xk2pdQ4PDzcXi6XJ0pXJ+d+HLi0VKlUylNTU9duz0ZHR39ubW19M6X0Yr2LA2vPvSmldzds2PD81q1bXz527NjO9vb29/fu3fvGpk2bnrs9a2xsfCGltD2l9GCdewNrVENK6dV169a93dDQ8N7GjRt3rl+//p2U0vY7ZK+nlB6qb10AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP/VH5yFPolq4uGdAAAAAElFTkSuQmCC',
			unix: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAACnUlEQVR4nO3bv2sWdwDH8e+f4J/wLJE7pxsaeJ5Hh6dd6iBWSCkm3jUP0kDrEAVNRUhKhkKhlNRFRBDT5cktQh2dPHOLdIqbEFIu+A9EcHD8dsnZ/Kh066X4esF3ueHhM7057rkLST8fJcN89eAJIYRD1/rFOAB0bT9YL9NhEdNhEdtgpYP8bjosYjLI3wgWcGIkw3y1Ddah64PieRswgBPhaLAm1XZW1k11Pl+JC8sP323Uf97oeiNACOF4sDbq5veybuKnXy7tfXXt5xdl3cR/+w2A/8TRYJV1U5V1E8/nK3H+5r2m3GyarjcChBBCOD3IL7XBmpqeyyb1zrism5h9thB/+u1Z3L/jqtozqbazrjcDH7F0kO+mwyKeOfv169nFta3RzFL85PPv4rc/PIpffPPj09nFta2rdx7sXb394FzXW4GP3NT0XJYOiydnL15/O5pZiuPv7/9x65fHu6OZpdjefV2YX32R9C/3ut4KEEIIoaybWNZN3Nhsfp1U29nC8sN3bbDWq1e9rvcBvFduNs1+sPbWq1e92cW1rTZYG5vNludXwIkxqbazg9E6GKz3D93rnXHXOwGO+dBb8FPTc1kvu3Sqq10Ax/xTsJL+5V46LGLSz0cdTgP4236YnrTBSgf53XRw5Ub7sbR/DIETI+kX42RQPP/Q6XofAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8H/0F7olCY2MH7ueAAAAAElFTkSuQmCC'
		};
	
	canvas.width = 16;
	canvas.height = 16;
	
	ctx.font = "bold 8px Ubuntu, 'Segoe UI', Tahoma, Arial, 'sans serif'";
	ctx.textAlign = 'center';
	
	// Find the correct favicon to use
	if(host.indexOf('chat.stackoverflow') === 0) {
		img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABnElEQVQ4jWNgwAMaGBiYHqdqT36SpvP/carOgdueKuz41OM2JE177ZM0nf+PUrUXkmwAAwMDw91QJf7HKTqnn6Tp/H+UplNNUMOrqaw5r6ew1D2fxCAKE3uYpKv0OEX3KdQlETg1P+5j4Hw9he3q66ls/19NZX35agpLzcsJDOIMDAwMj5O1zR6n6P54nKb942GqpgtWAxoaGJheTWVQeTeNqe31VJbPUINev5rB0ny/gUHgSbaqz5Mk/T+Pk3UbCXrlQT+D5NupTE3vpjG9fTOV9f+racxvXvZzND0tk/JrYGBgwtCwqtCSc3WFQ/GqEqfAZYWO2vMTFDgYGBgYrjaI8jybyFn0bhrTo3fTmf6/mc4gjdXGVcW2WmsrHP/D8OpypzcrS10OrC53bN1QaRVypFkj6FaPSCROJ88sd+FfV2YdtKHCrmV9he3ODeW29zZU2P1fX2H/f2254//VZU7/VxY72WFozM3J+Z+bk/Mfq6HFviJzy31tFld4payscJ44s8BdEkM9sgCMjQtjtZCqBhADcBpAKqaKAQB1iiloT36niAAAAABJRU5ErkJggg==';
	} else if(host.indexOf('chat.meta.stackexchange') === 0) {
		img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABWklEQVQ4ja2QvUpDQRCFLykkhYhFkGApVj6AlVhZikiw8AEsbxpDGiPu2Znd2CQEkXAJ3DuzeQAfwNLa2tpCLERSWaWQtUlAMNcfcODAsMz55uwkyTcFoOKcu/beR+fcHYCl7+ZLId77G+99ZObxnwEzyIpz7n6W5OxHg4ikInIxGo1qnyAbzPzsvY9EdFxqVtWqiDyoalTVFxE5z7JsLUmSxDm3zcxT59yUmffK4lbyPN9U1UsReVPVKCKvIQQeDAar3W53n4jeicj++JXhcFgPIbCqTmaJJnmec7/fPwBQWbS9CuAUwCGALQDVGWi5KIrT8Xj8FEKIRVGsl8XfstbGuYwxE2PMnTHGM/NRr9drZFlWfsBms7kCoAHAE9GttfaRiCIRRWttBBAB7H4xpmka0zSNi6CtVqvW6XR2AJwAuGq32/Uv858f5n2ZFi78V8BvqhTwV/0L4AMhxDwD8Y9esAAAAABJRU5ErkJggg==';
	} else {
		var smallIconUrl = document.querySelectorAll('#sidebar-menu .small-site-logo')[0].src,
			found = false;
		
		for(var i in sites){
			if(smallIconUrl.indexOf(i) !== -1) {
				img.src = sites[i];
				found = true;
				break;
			}
		}
		
		if(!found) {
			img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA5ElEQVQ4jWNggIKG/ftZFt19l7Ho9rtKvPjuu4yG/ftZGNDBkrvvtqx88OE/MXjqjTerMQxYee/DT2I0T7/55n/LxRffMAygGBQf+PIfHw7d/PG/2dL3cEySAeiasRpAMUiceec/OnZovvpfNvcsVkzQAHyasRpAMUho3vwkuW3bf6ecZf8VAqfhxfKBUz+LOkzlQTEgqXnLa2I0QwyY9kfGvU8IxQD7rEW+CgHTTsoHTDsDx4FTrysETP2BZsAtuYApsUR7DU1zBslhoxA47b9CwNSP8v5TsknWDDNAzneKNi55AC2gU1dDOLAVAAAAAElFTkSuQmCC';
		}
	}
	
	// Start title watching process
	setInterval(function(){
		if(title !== document.title) {
			title = document.title;
			var times, mention = false, ctitle = title, url;
			
			if(title.indexOf('(') === 0){
				ctitle = title.substring(1, title.indexOf(')'));
				if(ctitle.indexOf('*') > -1){
					mention = true;
					
					if(ctitle.length === 1){
						times = 0;
					} else {
						times = parseInt(ctitle, 10);
					}
				} else {
					times = parseInt(ctitle, 10);
				}
			} else {
				times = 0;
			}
			
			if(times > 0 || mention) {
				// Draw ma circlez!
				ctx.clearRect(0, 0, 16, 16);
				ctx.fillStyle = mention ? "rgba(63, 175, 7, 0.8)" : "rgba(200, 0, 30, 0.6)";
				
				ctx.drawImage(img, 0, 0);
				
				ctx.beginPath();
				ctx.arc(11, 11, 5, 0, Math.PI*2, true);
				ctx.fill();
				
				ctx.fillStyle = "#fff";
				
				if(times < 10){
					ctx.fillText(times, 11, 13);
				} else if(times < 100){
					ctx.fillText(~~(times/10), 9, 13);
					ctx.fillText((times%10), 13, 13);
				} else {
					ctx.fillText('+', 11, 13);
				}
				
				url = canvas.toDataURL("image/png");
			} else {
				url = iconURL;
			}
			
			var linkEle = getLink(),
				newLink = document.createElement('link'),
				head = document.getElementsByTagName('head')[0];
			
			newLink.rel = 'shortcut icon';
			newLink.type = 'image/png';
			newLink.href = url;
			
			head.removeChild(linkEle);
			head.appendChild(newLink);
		}
	}, 500);
})();

