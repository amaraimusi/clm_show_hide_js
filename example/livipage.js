
$( function() {
	

	var liviPage = new LiviPage();
	liviPage.execution();
	
});



/**
 * livipage.js | ページ内リンク先プレビュー
 * 
 * ページ内リンクをクリックすると、リンク先をプレビュー表示する。
 * アンカーのclass属性にlivipageを追加するだけで使用可能。
 * 
 * 2.0から別ページのリンク先をプレビュー表示できるようにした。
 * ただし、別ページは同じドメイン内のファイルに限る。
 * また、フラグメントを指定しない場合はただのリンクになる。body直下のセクションは取得できない。(divでラップされてること）
 * 
 * 
 * 要素の予約語
 * class=livipage
 * id=livipage_tooltip
 * 
 * 
 * @version 2.0
 * @date 2016-7-13 ver 2.0 別ページの子画面表示に対応
 * @date 2016-6-13 ver 1.2 最小サイズに対応
 * @date 2016-1-19 オブジェクト化。オプション指定。
 * @date 2016-1-14 ver 1.0
 * @date 2016-1-4 新規作成
 * @author wacgance 
 * 
 */
var LiviPage =function(){
	
	// 自分自身のインスタンス。 
	var myself=this;
	
	// PJOリスト (外部 page jQuery Object List)
	this.pjoList = {};

	
	this.execution=function(){
		//ツールチップ用DIV
		$(document.body).append("<div id='livipage_tooltip'></div>");

		
		//デフォルトCSSデータ
		var cssData = {
			'z-index':2,
			'background-color':'white',
			'position':'absolute',
			'border':'solid 2px #ccb1bf',
			'padding':'5px',
			'width':'auto',
			'height':'460px',
			'overflow-y':'auto',
		}
		
		
		//ツールチップの外をクリックするとツールチップを閉じる
		$(document).click(
				function (){
					$('#livipage_tooltip').hide();
				});
		
		//領域外クリックでツールチップを閉じるが、ツールチップ自体は領域内と判定させ閉じないようにする。
		$('#livipage_tooltip').click(function(e) {
			e.stopPropagation();
		});
		

		//対象リンクをクリックするとツールチップを表示させる。
		$('.livipage').click(
				function(){
					
					// livipageアクション
					var linkFlg = myself.livipageAction(this,cssData);
					
					return linkFlg;// false:リンク無効   true:リンク有効
				}
			);
		
		
		
	};
	
	
	
	/**
	 * livipageアクション
	 * @param elm 子画面要素
	 * @param cssData 子画面のCSSスタイル
	 * @return リンク有効フラグ   false:リンク無効   true:リンク有効
	 */
	this.livipageAction=function(elm,cssData){
		//対象セレクタ
		var href=$(elm).attr('href');
		var res = splitHref(href);// hrefを#で分割し、URLとフラグメントを取得する
		
		var url = res.url;
		var flgment = res.flgment;
		var linkFlg = false;// リンク有効フラグ   false:リンク無効   true:リンク有効
		
		// URL有り	フラグメント有り
		if(url && flgment){
			
			if(this.pjoList[url]){

				// PJOをリストから取得、そしてPJOをフラグメントで探し、セクション要素を取得する
				pjo = this.pjoList[url];
				var tt_html = $(pjo).find(flgment).html();
				
				// 子画面表示
				this.livipageAction2(elm,cssData,tt_html,url,flgment);
				
				
			}else{

				// Ajaxによる外部ページ読込
				this.ajaxLoadOuterHtml(elm,cssData,url,flgment,this.livipageAction2);
				
				
			}
		}
		
		
		
		
		// URL有り	フラグメント無し
		else if(url && flgment==''){
			
			linkFlg = true;// リンク有効化
		}
		
		
		
		
		// URL無し	フラグメント有り
		else if(url=='' && flgment){

			var tt_html=$(flgment).html();
			this.livipageAction2(elm,cssData,tt_html,url,flgment);
		}
		
		
		
		
		// URL無し	フラグメント無し
		else{

		}
		
		return linkFlg;

	};
	
	/**
	 * 子画面表示
	 * @param elm 子画面要素
	 * @param cssData 子画面要素のCSSスタイル
	 * @param tt_html 子画面要素に表示するセクション要素
	 * @param url URL（フラグメントを除く）
	 * @param flgment フラグメント
	 */
	this.livipageAction2=function(elm,cssData,tt_html,url,flgment){
	
		//対象要素の右上位置を取得
		var offset=$(elm).offset();
		var left = offset.left;
		var top = offset.top;

		
		//リンクを作成する
		var link_text=$(elm).html();
		var link1="<a href='" + url + flgment + "'>" + link_text + "</a><br>";
		
		tt_html = link1 + tt_html;
		
		$('#livipage_tooltip').show();
		

		
		$('#livipage_tooltip').css(cssData);
		

		
		//ツールチップにHTMLをセット
		$('#livipage_tooltip').html(tt_html);
		
		//ツールチップの位置を算出
		var tt_left=left;
		var tt_top=top + 16;
		

		// 最小サイズの調整
		var minWidth = 250;
		var ww = $(window).width();
		if(tt_left + minWidth > ww){
			tt_left = ww - minWidth;
		}


		//ツールチップ要素に位置をセット
		$('#livipage_tooltip').offset({'top':tt_top,'left':tt_left });
	}
	
	
	// Ajaxによる外部ページ読込
	this.ajaxLoadOuterHtml=function(elm,cssData,url,flgment,callback){
		
	
		$.ajax({
			type: "GET",
			url: url,
			cache: false,
			dataType: "text",
			success: function(text, type) {

				// 外部HTMLテキストをパースして、外部PJOとして取得する
				var pjo = $.parseHTML(text);
				
				// 外部PJOリストにURLをキーに外部PJOを追加する。
				myself.pjoList[url] = pjo;

				// フラグメントで探し、セクション要素を取得する
				var tt_html = $(pjo).find(flgment).html();
				
				// 子画面の呼出し。コールバック（ livipageAction2 )
				callback(elm,cssData,tt_html,url,flgment);


			},
			error: function(xmlHttpRequest, textStatus, errorThrown){
				
				// 仮コード
				callback(elm,cssData);
			}
		});	
		
		
	}
	
	
	
	
	// hrefを#で分割し、URLとフラグメントを取得する
	function splitHref(href){
		
		// フォーマット
		var res={'url':'','flgment':''};
		
		// 空である場合
		if(href == "" || href==null){
			return res;
		}
		
		// フラグメントの位置
		var a = href.indexOf('#');
		
		// フラグメントのみである場合
		if(a == 0){
			res.flgment = href;
		}
		
		// URLのみである場合
		else if(a == -1){
			res.url = href;
		}
		
		// URL+フラグメント
		else{
			res.url = href.substring(0,a);
			res.flgment = href.substring(a);
			if(res.flgment=='#'){
				res.flgment='';
			}
		}
		
		return res;

	}
	

	
};
















